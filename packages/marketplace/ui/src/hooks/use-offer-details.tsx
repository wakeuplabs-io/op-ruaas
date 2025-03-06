import { useReadContract } from "wagmi";
import type { Config as WagmiConfig } from "@wagmi/core";
import { MARKETPLACE_ADDRESS, MARKETPLACE_ABI } from "@/shared/constants/marketplace";
import { Offer, OfferReturnTuple } from "@/types";

export function useOfferDetails(offerId?: bigint) {
  const { data, isLoading, error } = useReadContract<
    typeof MARKETPLACE_ABI,
    "offers",
    [bigint],
    WagmiConfig,
    OfferReturnTuple
  >({
    address: MARKETPLACE_ADDRESS,
    abi: MARKETPLACE_ABI,
    functionName: "offers",
    args: [offerId],

  });
  const offer: Offer | null = data
    ? {
        vendor: data[0],
        pricePerMonth: data[1],
        remainingUnits: data[2],
        metadata: data[3],
      }
    : null;

  return { offer, isLoading, error };
}
