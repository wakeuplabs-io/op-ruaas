import { useAccount, useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/shared/constants";

export function useGetUserRollups() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getClientOrders",
    args: [address],
  });
  const rollups: bigint[] = data as bigint[];

  return { rollups, isLoading, error };
}
