import { useEffect, useState } from "react";
import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  ERC20_TOKEN_ADDRESS,
  ERC20_TOKEN_ABI,
} from "@/shared/constants";

export function useDeposit() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync, status } = useWriteContract();

  // Estados para trackear la transacción
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    console.log({ status });
  }, [status]);
  const depositFunds = async (orderId: bigint, amount: bigint) => {
    if (!walletClient) {
      setIsError(true);
      setErrorMessage("No wallet connected");
      return;
    }

    setIsPending(true);
    setIsSuccess(false);
    setIsError(false);
    setErrorMessage(null);
    setTxHash(null);

    try {
      await writeContractAsync({
        address: ERC20_TOKEN_ADDRESS,
        abi: ERC20_TOKEN_ABI,
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, amount],
      });

      const tx = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "deposit",
        args: [orderId, amount],
      });
      console.log({ tx });
      setIsSuccess(true);
      setTxHash(tx);
      return tx;
    } catch (error) {
      setIsError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
      console.error("Deposit failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  return {
    depositFunds,
    userAddress: address,
    isPending,
    isSuccess,
    isError,
    errorMessage,
    txHash,
  };
}
