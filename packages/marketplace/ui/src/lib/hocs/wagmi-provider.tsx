import { useMemo } from "react";
import { createConfig, WagmiProvider } from "wagmi";
import { defineChain, http, Chain } from "viem";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { braveWallet } from "@rainbow-me/rainbowkit/wallets";
import { NetworkConfig } from "@/types";
import { holesky, optimismSepolia } from "wagmi/chains";

export const optimismTestnet: NetworkConfig = {
  ...optimismSepolia,
  logoURI: new URL("@/assets/ethereum-icon.svg", import.meta.url).href, 
  isTestnet: true,
  chainId: optimismSepolia.id,
  rpcUrls: {
    default: {
      http: [optimismSepolia.rpcUrls.default.http[0]],
    },
  },
  explorer: {
    default: {
      url: optimismSepolia.blockExplorers.default.url,
    },
  },
};

export const holeskyTestnet: NetworkConfig = {
  ...holesky,
  chainId: holesky.id,
  rpcUrls: {
    default: {
      http: [holesky.rpcUrls.default.http[0]],
    },
  },
  explorer: {
    default: {
      url: holesky.blockExplorers.default.url,
    },
  },
}

export const gethTestnetL1: NetworkConfig = {
  name: "Geth Network",
  chainId: 1337,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  explorer: {
    default: {
      url: "http://localhost:8545", 
    },
  },
  isTestnet: true, 
};

export function WagmiSetup({ children }: { children: React.ReactNode }) {
  const definedChains: [Chain, ...Chain[]] = useMemo(() => {
    let myChains: [Chain, ...Chain[]] = [
      defineChain({
        ...optimismTestnet,
        id: optimismTestnet.chainId,
      }),
      defineChain({
        ...gethTestnetL1,
        id: gethTestnetL1.chainId,
      }),
    ];
    return myChains;
  }, []);

  const transports = useMemo(() => {
    const transportMap: Record<number, ReturnType<typeof http>> = {};
    definedChains.forEach((chain) => {
      transportMap[chain.id] = http();
    });
    return transportMap;
  }, [definedChains]);

  const connectors = connectorsForWallets(
    [
      {
        groupName: "My Wallets",
        wallets: [metaMaskWallet, braveWallet],
      },
    ],
    {
      appName: "RUASS",
      projectId: "RUASS_POC",
    }
  );

  const config = createConfig({
    chains: definedChains,
    transports,
    connectors,
    ssr: false,
  });

  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}
