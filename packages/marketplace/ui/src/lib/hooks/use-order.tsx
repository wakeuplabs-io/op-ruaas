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


const safeParseJSON = (value: string | null | undefined) => {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
};



export const useOrderDetails = ({ id }: { id: bigint }) => {
  const { data: order } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    chainId: MARKETPLACE_CHAIN_ID,
    abi: MARKETPLACE_ABI,
    functionName: "getOrder",
    args: [id],
    query: {
      enabled: !!id,
    }
  });

  console.log({id, order})
  return {
    data: order
      ? {
          order: {
            client: (order as any).client,
            createdAt: (order as any).createdAt,
            fulfilledAt: (order as any).fulfilledAt,
            terminatedAt: (order as any).terminatedAt,
            lastWithdrawal: (order as any).lastWithdrawal,
            balance: (order as any).balance,
            setupMetadata: safeParseJSON((order as any).setupMetadata) as OrderSetupMetadata,
            deploymentMetadata: safeParseJSON((order as any).deploymentMetadata) as OrderDeploymentMetadata,
          } as Order,
          offer: {
            vendor: (order as any).offer.vendor,
            pricePerMonth: (order as any).offer.pricePerMonth,
            remainingUnits: (order as any).offer.remainingUnits,
            metadata: safeParseJSON((order as any).offer.metadata) as OfferMetadata,
          },
        }
      : null,
  };
};
