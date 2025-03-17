import { useMemo } from "react";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useWalletClient, useWriteContract } from "wagmi";
import { useEnsureChain } from "./use-ensure-chain";
import { useOrderDetails } from "./use-order";

export const useTerminate = ({ orderId }: { orderId: bigint }) => {
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const { data } = useOrderDetails({ id: orderId });
  const { ensureChainId } = useEnsureChain();

  const isSubscribed = useMemo(() => {
    if (!data) return false;
    console.log(data.order.terminatedAt)
    return data.order.terminatedAt == 0n;
  }, [data]);

  const terminate = async (): Promise<string> => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }
    console.log({isSubscribed, termi: data?.order.terminatedAt})
    if (!isSubscribed) {
      throw new Error("Order already terminated");
    }

    await ensureChainId(MARKETPLACE_CHAIN_ID);

    const terminateTx = await writeContractAsync({
      abi: MARKETPLACE_ABI,
      address: MARKETPLACE_ADDRESS,
      chainId: MARKETPLACE_CHAIN_ID,
      functionName: "terminateOrder",
      args: [orderId],
    });
    console.log({terminateTx})
    return terminateTx;
  };

  return {
    isSubscribed,
    terminate,
  };
};
