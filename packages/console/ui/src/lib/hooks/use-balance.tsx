import { useAccount, useReadContract } from "wagmi";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";

export function useBalance(orderId: bigint) {
  //   const { address } = useAccount();

  const {
    data: balance,
    isPending,
    error,
  } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "balanceOf",
    args: ["0xF754D0f4de0e815b391D997Eeec5cD07E59858F0", orderId],
    chainId: MARKETPLACE_CHAIN_ID,
    query: {
      initialData: 0,
    },
  });

  return {
    balance: balance as bigint,
    isPending,
    error,
  };
}
