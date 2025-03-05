import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/shared/constants";

export function useWithdraw() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const withdrawFunds = async (orderId: bigint, amount: bigint) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    try {
      const tx = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "withdraw",
        args: [orderId, amount],
      });
      return tx;
    } catch (error) {
      throw error;
    }
  };

  return { withdrawFunds, userAddress: address };
}
