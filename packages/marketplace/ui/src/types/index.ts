import { Address } from "viem";

type NativeCurrency = {
  name: string;
  symbol: string;
  decimals: number;
};

type RpcUrls = {
  default: {
    http: string[];
  };
};
type BlockExplorers = {
  default: {
    url: string;
  }
}

export type NetworkConfig = {
  id?: number;
  explorer: BlockExplorers;
  name: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: RpcUrls;
  logoURI?: string;
  user?: Address;
  featured?: boolean;
  isTestnet?: boolean;
  chainId: number;
};

export type Plan = {
  id: bigint;
  title: string;
  price: number;
  features: string[];
  buttonText: string;
  deploymentFee: bigint;
};