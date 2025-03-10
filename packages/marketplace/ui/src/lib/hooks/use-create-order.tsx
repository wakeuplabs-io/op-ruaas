import { usePublicClient, useWalletClient, useWriteContract } from "wagmi";
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  MARKETPLACE_TOKEN,
  ERC20_TOKEN_ABI,
} from "../../shared/constants/marketplace";
import { OrderMetadata } from "@/types";
import { decodeEventLog } from "viem";

export function useCreateOrder() {
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync, isPending } = useWriteContract();
  const client = usePublicClient();

  const createOrder = async (
    offerId: bigint,
    initialCommitment: bigint,
    pricePerMonth: bigint,
    metadata: OrderMetadata
  ) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    const tokensToApprove = initialCommitment * pricePerMonth;
    try {
      await writeContractAsync({
        address: MARKETPLACE_TOKEN,
        abi: ERC20_TOKEN_ABI,
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, tokensToApprove],
      });

      const orderTx = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "createOrder",
        args: [offerId, initialCommitment, JSON.stringify(metadata)],
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
    }
  };

  return { createOrder, isPending };
}
