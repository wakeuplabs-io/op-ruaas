import { useMemo } from "react";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useWalletClient, useWriteContract } from "wagmi";
import { useOrder } from "./use-order";

export const useUnsubscribe = ({ orderId }: { orderId: bigint }) => {
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const { terminatedAt } = useOrder({ id: orderId });

  const isSubscribed = useMemo(() => {
    return terminatedAt == 0n;
  }, [terminatedAt]);

  const unsubscribe = async (): Promise<string> => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    if (isSubscribed) {
      throw new Error("Order already terminated");
    }

    const terminateTx = await writeContractAsync({
      abi: MARKETPLACE_ABI,
      address: MARKETPLACE_ADDRESS,
      chainId: parseInt(MARKETPLACE_CHAIN_ID),
      functionName: "terminatePayment",
      args: [orderId],
    });

    return terminateTx;
  };

  return {
    isSubscribed,
    unsubscribe,
  };
};
