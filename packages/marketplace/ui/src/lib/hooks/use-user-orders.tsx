import { useAccount, useReadContract } from "wagmi";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI, MARKETPLACE_CHAIN_ID } from "@/shared/constants/marketplace";

export function useGetUserRollups() {
  const { address } = useAccount();

  const { data, isLoading, error } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "getClientOrders",
    args: [address],
    chainId: MARKETPLACE_CHAIN_ID,
  });
  const rollups: bigint[] = data as bigint[];

  return { rollups, isLoading, error };
}
