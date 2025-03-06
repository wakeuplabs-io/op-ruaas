import { useAccount, useWalletClient, useWriteContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, MARKETPLACE_TOKEN, ERC20_TOKEN_ABI } from "../shared/constants/marketplace";

export function useCreateOrder() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const approveAndCreateOrder = async (offerId: bigint, initialCommitment: bigint, pricePerMonth: bigint) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    const tokensToApprove = initialCommitment * pricePerMonth * 10n ** 18n;
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
        args: [offerId, initialCommitment, '{}'],
      });
      console.log({orderTx})

      return orderTx;
    } catch (error) {
      console.log({error})

      throw error;
    }
  };

  return { approveAndCreateOrder, userAddress: address };
}
