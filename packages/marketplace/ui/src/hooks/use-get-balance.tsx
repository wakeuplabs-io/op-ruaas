import { useAccount, useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/shared/constants";

export function useGetBalance(orderId: string) {
  const { address } = useAccount();
  console.log("orderId", orderId)
  const { data, isLoading, error } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "balanceOf",
    args: [address, BigInt(orderId)],
  });

  const balance: bigint = data as bigint;
  return { balance, isLoading, error };
}
