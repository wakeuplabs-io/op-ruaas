import { useAccount, useReadContract } from "wagmi";
import type { Config as WagmiConfig } from "@wagmi/core";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { OrderData } from "@/types";
import { safeParseJSON } from "../utils";

export function useVendorOrders() {
  const { address } = useAccount();

  const {
    data: orders,
    isLoading,
    error,
  } = useReadContract<
    typeof MARKETPLACE_ABI,
    "getVendorOrders",
    [string],
    WagmiConfig,
    OrderData[]
  >({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getVendorOrders",
    args: [address],
    chainId: MARKETPLACE_CHAIN_ID,
    query: {
      initialData: [],
    },
  });

  return {
    orders: orders
      ? orders.map((o) => ({
          ...o,
          deploymentMetadata: safeParseJSON(o.deploymentMetadata),
          setupMetadata: safeParseJSON(o.setupMetadata),
          offer: {
            ...o.offer,
            metadata: safeParseJSON(o.offer.metadata),
          },
        }))
      : [],
    isLoading,
    error,
  };
}
