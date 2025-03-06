import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useMemo } from "react";
import { useReadContract, useWalletClient, useWriteContract } from "wagmi";

export const useUnsubscribe = ({ orderId }: { orderId: bigint }) => {
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const { data } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "orders",
    args: [orderId],
  });

  const isSubscribed = useMemo(() => {
    if (!data) {
      return false;
    }

    return (data as any).terminatedAt === 0;
  }, [data]);

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
