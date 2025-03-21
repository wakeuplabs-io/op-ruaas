import { useState } from "react";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useWalletClient, useWriteContract } from "wagmi";
import { useEnsureChain } from "./use-ensure-chain";
import { useOrderDetails } from "./use-order";

export const useTerminate = ({ orderId }: { orderId: bigint }) => {
  const { data } = useOrderDetails({ id: orderId });
  
  const { ensureChainId } = useEnsureChain();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  
  const [isPending, setIsPending] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(data?.order.terminatedAt == 0n)


  const terminate = async (): Promise<string> => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }
    if (!isSubscribed) {
      throw new Error("Order already terminated");
    }

    setIsPending(true);

    try {
      await ensureChainId(MARKETPLACE_CHAIN_ID);

      const terminateTx = await writeContractAsync({
        abi: MARKETPLACE_ABI,
        address: MARKETPLACE_ADDRESS,
        chainId: MARKETPLACE_CHAIN_ID,
        functionName: "terminateOrder",
        args: [orderId],
      });
      setIsSubscribed(false);

      return terminateTx;
    } catch (e) {
      throw e;
    } finally {
      setIsPending(false);
    }
  };

  return {
    isSubscribed,
    isPending,
    terminate,
  };
};
