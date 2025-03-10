import { NetworkConfig } from "@/types";
import { optimismSepolia } from "wagmi/chains";

export const optimismTestnet: NetworkConfig = {
  ...optimismSepolia,
  logoURI: new URL("@/assets/ethereum-icon.svg", import.meta.url).href,
  isTestnet: false,
  chainId: optimismSepolia.id,
  rpcUrls: {
    default: {
      http: [optimismSepolia.rpcUrls.default.http[0]],
    },
  },
  explorer: {
    default: {
      url: optimismSepolia.blockExplorers.default.url,
    }
  },
};

export const defaultCustomMainnet = optimismTestnet;
