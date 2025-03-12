import { useAccount, useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, MARKETPLACE_CHAIN_ID } from "@/shared/constants/marketplace";

export function useGetBalance(orderId: string) {
  const { address } = useAccount();
  const { data, isLoading, error, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "balanceOf",
    args: [address, BigInt(orderId)],
    chainId: MARKETPLACE_CHAIN_ID,
    query: {
      enabled: !!orderId,
    },
  });

  const balance: bigint = data ? data as bigint : 0n 
  return { balance, isLoading, error, refetch };
}
