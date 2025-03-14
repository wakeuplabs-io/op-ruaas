import { useAccount, useReadContract } from "wagmi";
import type { Config as WagmiConfig } from "@wagmi/core";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
} from "@/shared/constants/marketplace";
import { Order, OrderSetupMetadata, OrderDeploymentMetadata, OfferMetadata, OrderData } from "@/types";

export function useOrders() {
  const { address } = useAccount();

  const {
    data: orders,
    isLoading,
    error,
    refetch: refetchOrders,
  } = useReadContract<
    typeof MARKETPLACE_ABI,
    "getClientOrders",
    [string],
    WagmiConfig,
    OrderData[]
  >({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getClientOrders",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  if (!orders) return { sequencerRollups: [] as Order[], replicaRollups: [], isLoading, error, refetch: refetchOrders };

  const { sequencerRollups, replicaRollups } = orders.reduce(
    (acc, order) => {
      let offerMetadata: OfferMetadata = { title: "Unknown", features: [] };
      let setupMetadata: OrderSetupMetadata = { name: "Unknown Rollup", artifacts: null };
      let deploymentMetadata: OrderDeploymentMetadata = { name: "Unknown Rollup", artifacts: null };

      try {
        if (order.offer.metadata) {
          offerMetadata = JSON.parse(order.offer.metadata);
        }
      } catch {
        offerMetadata = { title: "Unknown", features: [] };
      }

      try {
        if (order.setupMetadata) {
          setupMetadata = JSON.parse(order.setupMetadata);
        }
      } catch {
        setupMetadata = { name: "Unknown Rollup", artifacts: null };
      }

      try {
        if (order.deploymentMetadata) {
          deploymentMetadata = JSON.parse(order.deploymentMetadata);
        }
      } catch {
        deploymentMetadata = { name: "Unknown Rollup", artifacts: null };
      }

      const categorizedOrder = {
        ...order,
        name: setupMetadata.name || "Unknown Rollup",
        setupMetadata,
        deploymentMetadata,
        offer: {
          ...order.offer,
          metadata: offerMetadata,
        },
      };

      if (offerMetadata.wallets) {
        acc.sequencerRollups.push(categorizedOrder as Order);
      } else {
        acc.replicaRollups.push(categorizedOrder);
      }

      return acc;
    },
    { sequencerRollups: [] as Order[], replicaRollups: [] as Order[] }
  );

  return {
    sequencerRollups,
    replicaRollups,
    isLoading,
    error,
    refetch: refetchOrders,
  };
}
