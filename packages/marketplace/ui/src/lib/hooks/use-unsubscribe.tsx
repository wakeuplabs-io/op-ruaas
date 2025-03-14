import { useMemo } from "react";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useWalletClient, useWriteContract } from "wagmi";
import { useOrderDetails } from "./use-order";
import { useEnsureChain } from "./use-ensure-chain";

export const useUnsubscribe = ({ orderId }: { orderId: bigint }) => {
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const { data } = useOrderDetails({ id: orderId });
  const { ensureChainId } = useEnsureChain();

  const isSubscribed = useMemo(() => {
    if (!data) return false;
    return data.order.terminatedAt == 0n;
  }, [data]);

  const unsubscribe = async (): Promise<string> => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    if (isSubscribed) {
      throw new Error("Order already terminated");
    }

    await ensureChainId(MARKETPLACE_CHAIN_ID);

    const terminateTx = await writeContractAsync({
      abi: MARKETPLACE_ABI,
      address: MARKETPLACE_ADDRESS,
      chainId: MARKETPLACE_CHAIN_ID,
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
