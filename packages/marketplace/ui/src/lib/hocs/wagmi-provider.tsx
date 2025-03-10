import { useMemo } from "react";
import { createConfig, WagmiProvider } from "wagmi";
import { defineChain, http, Chain } from "viem";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { braveWallet } from "@rainbow-me/rainbowkit/wallets";
import { optimismTestnet } from "@/lib/wagmi";

function WagmiSetup({ children }: { children: React.ReactNode }) {

  const definedChains: [Chain, ...Chain[]] = useMemo(() => {
    let myChains: [Chain, ...Chain[]] = [
      defineChain({
        ... optimismTestnet,
        id:  optimismTestnet.chainId,
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
    },
  );

  const config = createConfig({
    chains: definedChains,
    transports,
    connectors,
    ssr: false,
    
  });

  return <WagmiProvider config={config}>{children}</WagmiProvider>;
}

export default WagmiSetup;
