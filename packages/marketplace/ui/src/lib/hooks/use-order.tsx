import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useEffect } from "react";
import { useReadContract } from "wagmi";


export const useOrder = ({ id }: { id: bigint }) => {
  const { data: order } = useReadContract({
    address: MARKETPLACE_ADDRESS,
    chainId: MARKETPLACE_CHAIN_ID,
    abi: MARKETPLACE_ABI,
    functionName: "orders",
    args: [id],
  });

  return {
    data: order
      ? {
          client: (order as any)[0],
          offerId: (order as any)[1],
          createdAt: (order as any)[2],
          fulfilledAt: (order as any)[3],
          terminatedAt: (order as any)[4],
          lastWithdrawal: (order as any)[5],
          balance: (order as any)[6],
          setupMetadata: JSON.parse((order as any)[7]),
          deploymentMetadata: JSON.parse((order as any)[8]),
          provider: {
            sequencer: "0x123",
            batcher: "0x123",
            proposer: "0x123",
            challenger: "0x123",
          },
          network: { l1ChainId: 1n },
          addresses: {
            systemConfigProxy: "0x123",
            l2OutputOracleProxy: "0x123",
            systemOwnerSafe: "0x123",
            proxyAdmin: "0x123",
          },
        }
      : null,
  };
};
