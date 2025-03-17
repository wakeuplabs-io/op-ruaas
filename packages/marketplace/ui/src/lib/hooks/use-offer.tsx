import { useReadContract } from "wagmi";
import type { Config as WagmiConfig } from "@wagmi/core";
import {
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { Offer, OfferMetadata, OfferReturnTuple } from "@/types";

export function useOffer(offerId?: bigint) {
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
    chainId: MARKETPLACE_CHAIN_ID,
  });

  const isInvalidOffer =
    !data || data[0] === "0x0000000000000000000000000000000000000000";

  const offer: Offer | null = !isInvalidOffer
  ? {
      vendor: data[0],
      pricePerMonth: data[1],
      remainingUnits: data[2],
      metadata: (() => {
        try {
          return JSON.parse(data[3]) as OfferMetadata;
        } catch {
          return {} as OfferMetadata;
        }
      })(),
    }
  : null;


  return { offer, isLoading, error };
}
