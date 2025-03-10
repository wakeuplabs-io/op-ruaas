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
import { pinata } from "../pinata";

export function useCreateOrder() {
  const client = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { ensureChainId } = useEnsureChain();
  const [isPending, setIsPending] = useState(false);

  const createOrder = async (
    offerId: bigint,
    initialCommitment: bigint,
    pricePerMonth: bigint,
    name: string,
    artifacts: File | null
  ) => {
    setIsPending(true);

    try {
      await ensureChainId(MARKETPLACE_CHAIN_ID);

      let artifactsCid: string | null = null;
      if (artifacts) {
        const upload = await pinata.upload.public.file(artifacts);
        artifactsCid = upload.cid;
      }

      const approveTx = await writeContractAsync({
        address: MARKETPLACE_TOKEN,
        abi: ERC20_TOKEN_ABI,
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, initialCommitment * pricePerMonth],
        chainId: MARKETPLACE_CHAIN_ID,
      });
      await client?.waitForTransactionReceipt({ hash: approveTx });

      const orderTx = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "createOrder",
        args: [
          offerId,
          initialCommitment,
          JSON.stringify({ name, artifacts: artifactsCid } as OrderMetadata),
        ],
        chainId: MARKETPLACE_CHAIN_ID,
      });

      const receipt = await client?.waitForTransactionReceipt({
        hash: orderTx,
      });

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
    } finally {
      setIsPending(false);
    }
  };

  return { createOrder, isPending };
}
