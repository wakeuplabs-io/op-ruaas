import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import {
  OfferMetadata,
  Order,
  OrderDeploymentMetadata,
  OrderSetupMetadata,
} from "@/types";
import { useReadContract } from "wagmi";
import { safeParseJSON } from "../utils";
import { zeroAddress } from "viem";

export const useOrderDetails = ({ id }: { id: bigint }) => {
  const { data: order, isLoading, refetch } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    chainId: MARKETPLACE_CHAIN_ID,
    abi: MARKETPLACE_ABI,
    functionName: "getOrder",
    args: [id],
    query: {
      enabled: !!id,
    },
  });
  if (!order || (order as any).client === zeroAddress) return { data: null };
  const currentUnixTime = BigInt(Math.floor(Date.now() / 1000));
  const secondsElapsed =
    (order as any).fulfilledAt > 0n
      ? currentUnixTime - (order as any).fulfilledAt
      : 0n;
  const pricePerSecond =
    (order as any).offer.pricePerMonth / (30n * 24n * 3600n);
  const adjustedBalance =
    (order as any).balance > secondsElapsed * pricePerSecond
      ? (order as any).balance - secondsElapsed * pricePerSecond
      : 0n;
  return {
    data: {
      order: {
        client: (order as any).client,
        createdAt: (order as any).createdAt,
        fulfilledAt: (order as any).fulfilledAt,
        terminatedAt: (order as any).terminatedAt,
        lastWithdrawal: (order as any).lastWithdrawal,
        balance: adjustedBalance,
        setupMetadata: safeParseJSON(
          (order as any).setupMetadata
        ) as OrderSetupMetadata,
        deploymentMetadata: safeParseJSON(
          (order as any).deploymentMetadata
        ) as OrderDeploymentMetadata,
      } as Order,
      offer: {
        vendor: (order as any).offer.vendor,
        pricePerMonth: (order as any).offer.pricePerMonth,
        remainingUnits: (order as any).offer.remainingUnits,
        metadata: safeParseJSON((order as any).offer.metadata) as OfferMetadata,
      },
    },
    isLoading,
    refetch
  };
};
