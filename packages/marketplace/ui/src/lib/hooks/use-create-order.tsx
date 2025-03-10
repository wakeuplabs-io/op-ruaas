import { usePublicClient, useWriteContract } from "wagmi";
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  MARKETPLACE_TOKEN,
  ERC20_TOKEN_ABI,
  MARKETPLACE_CHAIN_ID,
} from "../../shared/constants/marketplace";
import { OrderMetadata } from "@/types";
import { decodeEventLog } from "viem";
import { useEnsureChain } from "./use-ensure-chain";
import { useState } from "react";

export function useCreateOrder() {
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { ensureChainId } = useEnsureChain();
  const [isPending, setIsPending] = useState(false);

  const createOrder = async (
    offerId: bigint,
    initialCommitment: bigint,
    pricePerMonth: bigint,
    metadata: OrderMetadata
  ) => {
    setIsPending(true);

    await ensureChainId(parseInt(MARKETPLACE_CHAIN_ID));

    const tokensToApprove = initialCommitment * pricePerMonth;
    try {
      await writeContractAsync({
        address: MARKETPLACE_TOKEN,
        abi: ERC20_TOKEN_ABI,
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, tokensToApprove],
        chainId: parseInt(MARKETPLACE_CHAIN_ID),
      });

      const orderTx = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "createOrder",
        args: [offerId, initialCommitment, JSON.stringify(metadata)],
        chainId: parseInt(MARKETPLACE_CHAIN_ID),
      });

      const receipt = await client?.waitForTransactionReceipt({
        hash: orderTx,
      });
      console.log("receipt", receipt);

      const newOrderEvent = receipt?.logs.find(
        (log) => log.address === MARKETPLACE_ADDRESS.toLowerCase()
      );
      if (!newOrderEvent) {
        throw new Error("Order creation failed");
      }

      const decoded = await decodeEventLog({
        abi: MARKETPLACE_ABI,
        eventName: "NewOrder",
        data: newOrderEvent.data,
        topics: newOrderEvent.topics,
      });

      return (decoded.args as any).orderId;
    } catch (error) {
      throw error;
    } finally{
      setIsPending(false);
    }
  };

  return { createOrder, isPending };
}
