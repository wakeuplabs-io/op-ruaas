import { useWalletClient, useWriteContract } from "wagmi";
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  MARKETPLACE_TOKEN,
  ERC20_TOKEN_ABI,
} from "@/shared/constants/marketplace";

export function useDeposit() {
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const depositFunds = async (orderId: bigint, amount: bigint) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    await writeContractAsync({
      address: MARKETPLACE_TOKEN,
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

    return tx;
  };

  return { depositFunds };
}
