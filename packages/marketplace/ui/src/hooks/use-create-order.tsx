import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, ERC20_TOKEN_ADDRESS, ERC20_TOKEN_ABI } from "../shared/constants";

export function useCreateOrder() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const approveAndCreateOrder = async (offerId: number, initialDeposit: bigint) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    try {
      await writeContractAsync({
        address: ERC20_TOKEN_ADDRESS,
        abi: ERC20_TOKEN_ABI,
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, initialDeposit],
      });
      const orderTx = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: MARKETPLACE_ABI,
        functionName: "createOrder",
        args: [offerId, initialDeposit],
      });
      console.log("Order transaction sent:", orderTx);
      return orderTx;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  };

  return { approveAndCreateOrder, userAddress: address };
}
