import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useCallback, useState } from "react";
import { useWriteContract } from "wagmi";

export const useTerminateOrder = () => {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);

  const terminateOrder = useCallback(
    async (orderId: bigint) => {
      setIsPending(true);

      try {
        const tx = await writeContractAsync({
          abi: MARKETPLACE_ABI,
          address: MARKETPLACE_ADDRESS,
          chainId: MARKETPLACE_CHAIN_ID,
          functionName: "terminateOrder",
          args: [orderId],
        });

        return tx;
      } catch (e) {
        console.error(e);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [setIsPending, writeContractAsync]
  );

  return { terminateOrder, isPending };
};
