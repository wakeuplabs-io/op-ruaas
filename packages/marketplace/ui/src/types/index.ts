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

// TODO: delete
export type OfferPlan = {
  id: bigint;
  title: string;
  pricePerMonth: bigint;
  features: string[];
  buttonText: string;
};

export type OfferMetadata = {
  title: string;
  features: string[];
  wallets: {
    sequencer: string;
    batcher: string;
    challenger: string;
    proposer: string;
  };
}

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
  metadata: OfferMetadata;
};

export type Plan = {
  months: bigint
  pricePerMonth: bigint
}
