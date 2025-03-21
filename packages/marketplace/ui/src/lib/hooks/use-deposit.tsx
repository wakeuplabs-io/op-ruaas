import { useWalletClient, useWriteContract } from "wagmi";
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  MARKETPLACE_TOKEN,
  ERC20_TOKEN_ABI,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useEnsureChain } from "./use-ensure-chain";

export function useDeposit() {
  const { ensureChainId } = useEnsureChain();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const depositFunds = async (orderId: bigint, amount: bigint) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    await ensureChainId(MARKETPLACE_CHAIN_ID);

    await writeContractAsync({
      address: MARKETPLACE_TOKEN,
      abi: ERC20_TOKEN_ABI,
      functionName: "approve",
      args: [MARKETPLACE_ADDRESS, amount],
      chainId: MARKETPLACE_CHAIN_ID,
    });

    const tx = await writeContractAsync({
      address: MARKETPLACE_ADDRESS,
      abi: MARKETPLACE_ABI,
      functionName: "deposit",
      args: [orderId, amount],
      chainId: MARKETPLACE_CHAIN_ID,
    });
    console.log(tx)

    return tx;
  };

  return { depositFunds };
}
