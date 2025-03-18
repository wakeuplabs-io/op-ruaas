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

export type Offer = {
  vendor: string;
  pricePerMonth: bigint;
  remainingUnits: bigint;
  metadata: OfferMetadata;
};

export type OfferMetadata = {
  title: string;
  features: string[];
  wallets?: {
    sequencer: string;
    batcher: string;
    challenger: string;
    proposer: string;
  };
}

export type OrderSetupMetadata = {
  name: string;
  artifacts: string | null;
}

export type OrderDeploymentMetadata = {
  artifacts: string | null;
  urls: {
    rpc: string;
    explorer: string;
    monitoring: string;
  },
  network: {
    l1ChainID: number;
    l2ChainID: number;
  };
  addresses: {
    [key: string]: `0x${string}`;
  };
}

export type OfferData = {
  vendor: string;
  pricePerMonth: bigint;
  remainingUnits: bigint;
  metadata: string;
}

export type OrderData = {
  id: bigint;
  client: string;
  name: string
  offerId: bigint;
  balance: bigint;
  createdAt: bigint;
  fulfilledAt: bigint;
  terminatedAt: bigint;
  lastWithdrawal: bigint;
  setupMetadata: string;
  deploymentMetadata: string;
  offer: OfferData;
};


export type Order = {
  id: bigint;
  client: string;
  offerId: bigint;
  balance: bigint;
  createdAt: bigint;
  fulfilledAt: bigint;
  terminatedAt: bigint;
  lastWithdrawal: bigint;
  setupMetadata: OrderSetupMetadata;
  deploymentMetadata: OrderDeploymentMetadata;
};

export type OfferReturnTuple = [
  vendor: string,
  pricePerMonth: bigint,
  remainingUnits: bigint,
  metadata: string
];

export type Plan = {
  months: number
  pricePerMonth: bigint
}

export type RollupItem = {
  id: bigint;
  name: string
}

export enum UnsubscribeStep {
  Unsubscribe,
  SetSequencer,
  SetBatcher,
  SetOracle,
  Done
}
