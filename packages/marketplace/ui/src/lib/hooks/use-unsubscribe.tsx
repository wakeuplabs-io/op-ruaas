import { useMemo } from "react";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useWalletClient, useWriteContract } from "wagmi";
import { useEnsureChain } from "./use-ensure-chain";
import { useOrder } from "./use-order";
import { useChainPermissions } from "./use-chain-permissions";

export enum UnsubscribeStep {
  Unsubscribe,
  SetSequencer,
  SetBatcher,
  SetOracle,
  Done
}

export const useUnsubscribe = ({ orderId }: { orderId: bigint }) => {
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const { terminatedAt } = useOrder({ id: orderId });
  const { ensureChainId } = useEnsureChain();

  const isSubscribed = useMemo(() => {
    return terminatedAt == 0n;
  }, [terminatedAt]);

  const {
    provider,
    network: { l1ChainId },
    addresses: {
      systemConfigProxy,
      l2OutputOracleProxy,
      systemOwnerSafe,
      proxyAdmin,
    },
  } = useOrder({ id: orderId });

  const {
    batcher,
    sequencer,
    proposer,
    challenger,
  } = useChainPermissions({
    l1ChainId: Number(l1ChainId),
    systemConfigProxy: systemConfigProxy as `0x${string}`,
    l2OutputOracleProxy: l2OutputOracleProxy as `0x${string}`,
    systemOwnerSafe: systemOwnerSafe as `0x${string}`,
    proxyAdmin: proxyAdmin as `0x${string}`,
  });

  const step = useMemo(() => {
    if (!isSubscribed) return UnsubscribeStep.Unsubscribe;
    if (sequencer === provider.sequencer) return UnsubscribeStep.SetSequencer;
    if (batcher === provider.batcher) return UnsubscribeStep.SetBatcher;
    if (proposer === provider.proposer) return UnsubscribeStep.SetOracle;
    if (challenger === provider.challenger) return UnsubscribeStep.SetOracle;
    return UnsubscribeStep.Done;
  }, [provider, isSubscribed, sequencer, batcher, proposer, challenger]);

  const unsubscribe = async (): Promise<string> => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    if (isSubscribed) {
      throw new Error("Order already terminated");
    }

    await ensureChainId(MARKETPLACE_CHAIN_ID);

    const terminateTx = await writeContractAsync({
      abi: MARKETPLACE_ABI,
      address: MARKETPLACE_ADDRESS,
      chainId: MARKETPLACE_CHAIN_ID,
      functionName: "terminatePayment",
      args: [orderId],
    });

    return terminateTx;
  };

  return {
    step,
    isSubscribed,
    unsubscribe,
  };
};
