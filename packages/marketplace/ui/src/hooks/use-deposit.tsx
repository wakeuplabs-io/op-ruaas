import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, ERC20_TOKEN_ADDRESS, ERC20_TOKEN_ABI } from "@/shared/constants";

export function useDeposit() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const depositFunds = async (orderId: bigint, amount: bigint) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

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

      console.log("Deposit transaction sent:", tx);
      return tx;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  };

  return { depositFunds, userAddress: address };
}
