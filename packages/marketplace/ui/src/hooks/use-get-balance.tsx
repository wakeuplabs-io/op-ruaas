import { useAccount, useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/shared/constants";

export function useGetBalance(orderId: string) {
  const { address } = useAccount();
  const { data, isLoading, error, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "balanceOf",
    args: [address, BigInt(orderId)],
    query: {
      enabled: !!orderId,
    },
  });

  const balance: bigint = data ? data as bigint : 0n 
  return { balance, isLoading, error, refetch };
}
