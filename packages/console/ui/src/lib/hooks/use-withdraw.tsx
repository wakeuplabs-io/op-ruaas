import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
  MARKETPLACE_TOKEN_DECIMALS,
} from "@/shared/constants/marketplace";
import { useCallback, useState } from "react";
import { parseUnits } from "viem";
import { useWriteContract } from "wagmi";

export const useWithdraw = () => {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);

  const withdraw = useCallback(
    async (orderId: bigint, amount: string) => {
      setIsPending(true);

      try {
        const amountInWei = parseUnits(amount, MARKETPLACE_TOKEN_DECIMALS);

        const tx = await writeContractAsync({
          abi: MARKETPLACE_ABI,
          address: MARKETPLACE_ADDRESS,
          chainId: MARKETPLACE_CHAIN_ID,
          functionName: "withdraw",
          args: [orderId, amountInWei],
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

  return { withdraw, isPending };
};
