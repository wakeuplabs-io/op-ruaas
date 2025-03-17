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
  //   const { address } = useAccount();

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
    args: ["0xF754D0f4de0e815b391D997Eeec5cD07E59858F0"],
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
