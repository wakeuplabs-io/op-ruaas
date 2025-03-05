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

export type OfferPlan = {
  id: bigint;
  title: string;
  price: number;
  features: string[];
  buttonText: string;
  deploymentFee: bigint;
};

export type OrdersReturnTuple = [
  client: string,
  offerId: bigint,
  balance: bigint,
  createdAt: bigint,
  fulfilledAt: bigint,
  terminatedAt: bigint, 
  lastWithdrawal: bigint,
  metadata: string 
]


export type Order = {
  client: string;
  offerId: bigint;
  balance: bigint;
  createdAt: bigint;
  fulfilledAt: bigint;
  terminatedAt: bigint;
  lastWithdrawal: bigint;
  metadata: string;
};

export type OfferReturnTuple = [
  vendor: string,
  pricePerMonth: bigint,
  remainingUnits: bigint,
  metadata: string
];

export type Offer = {
  vendor: string;
  pricePerMonth: bigint;
  remainingUnits: bigint;
  metadata: string;
};

export type Plan = {
  months: bigint
  pricePerMonth: bigint
}
