import envParsed from "@/envParsed";
import { NetworkConfig } from "@/types";
import { arbitrum, arbitrumSepolia, mainnet, sepolia } from "wagmi/chains";

export const l2Chain = envParsed().IS_TESTNET ? arbitrumSepolia : arbitrum;

export const customMainnet: NetworkConfig = {
  ...mainnet,
  logoURI: new URL("@/assets/ethereum-icon.svg", import.meta.url).href,
  isTestnet: false,
  chainId: mainnet.id,
  rpcUrls: {
    default: {
      http: [mainnet.rpcUrls.default.http[0]],
    },
  },
  explorer: {
    default: {
      url: mainnet.blockExplorers.default.url,
    }
  },
};
export const customSepolia: NetworkConfig = {
  ...sepolia,
  logoURI: new URL("@/assets/ethereum-icon.svg", import.meta.url).href,
  isTestnet: envParsed().IS_TESTNET,
  chainId: sepolia.id,
  explorer: {
    default: {
      url: sepolia.blockExplorers.default.url,
    }
  },
  rpcUrls: {
    default: {
      http: ["https://ethereum-sepolia-rpc.publicnode.com"],
    },
  },
};

export const defaultCustomMainnet = envParsed().IS_TESTNET ? customSepolia : customMainnet;
