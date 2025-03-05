import { useOfferDetails } from "./use-offer-details";
import { useReadContract } from "wagmi";
import type { Config as WagmiConfig } from "@wagmi/core";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/shared/constants";
import { Order, OrdersReturnTuple } from "@/types";

export function useOrderDetails(orderId?: string) {
  const {
    data,
    isLoading,
    error,
    refetch: refetchOrder,
  } = useReadContract<
    typeof MARKETPLACE_ABI,
    "orders",
    [bigint],
    WagmiConfig,
    OrdersReturnTuple
  >({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "orders",
    args: orderId ? [BigInt(orderId)] : undefined,
    query: {
      enabled: !!orderId,
    },
  });

  const order: Order | null = data
    ? {
        client: data[0],
        offerId: data[1],
        balance: data[2],
        createdAt: data[3],
        fulfilledAt: data[4],
        terminatedAt: data[5],
        lastWithdrawal: data[6],
        metadata: data[7],
      }
    : null;

  const { offer, isLoading: isOfferLoading} = useOfferDetails(order?.offerId);
  const refetch = async () => {
    await refetchOrder();
  };

  return { order, offer, isLoading: isLoading || isOfferLoading, error, refetch };
}
