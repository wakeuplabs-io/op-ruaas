import { Offer, Order, UnsubscribeStep } from "@/types";
import { useMemo } from "react";
import { useChainPermissions } from "./use-chain-permissions";
import { useTerminate } from "./use-terminate";
import { zeroAddress } from "viem";

export const useUnsubscribe = ({ order, offer }: { order: Order; offer: Offer }) => {
  const { terminate, isPending: isTerminatePending } = useTerminate({
    orderId: order.id,
  });
  const {
    batcher,
    sequencer,
    challenger,
    proposer,
    setBatcherAddress,
    setSequencerAddress,
    setOracleAddress,
  } = useChainPermissions({
    l1ChainId: Number(order.deploymentMetadata.network.l1ChainID ?? 0),
    systemConfigProxy:
      order.deploymentMetadata.addresses.systemConfigProxy ?? zeroAddress,
    l2OutputOracleProxy:
      order.deploymentMetadata.addresses.l2OutputOracleProxy ?? zeroAddress,
    systemOwnerSafe:
      order.deploymentMetadata.addresses.systemOwnerSafe ?? zeroAddress,
    proxyAdmin: order.deploymentMetadata.addresses.proxyAdmin ?? zeroAddress,
  });

  const isSubscribed = useMemo(() => {
    return order.terminatedAt == 0n;
  }, [order]);

  const provider = useMemo(() => {
    return {
      batcher: offer.metadata.wallets?.batcher ?? zeroAddress,
      sequencer: offer.metadata.wallets?.sequencer ?? zeroAddress,
      proposer: offer.metadata.wallets?.proposer ?? zeroAddress,
      challenger: offer.metadata.wallets?.challenger ?? zeroAddress,
    };
  }, [offer]);

  const step = useMemo(() => {
    if (isSubscribed) return UnsubscribeStep.Unsubscribe;
    if (sequencer === provider.sequencer) return UnsubscribeStep.SetSequencer;
    if (batcher === provider.batcher) return UnsubscribeStep.SetBatcher;
    if (proposer === provider.proposer) return UnsubscribeStep.SetOracle;
    if (challenger === provider.challenger) return UnsubscribeStep.SetOracle;
    return UnsubscribeStep.Done;
  }, [provider, isSubscribed, sequencer, batcher, proposer, challenger]);

  return {
    terminate,
    isTerminatePending,
    step,
    setSequencerAddress,
    setBatcherAddress,
    setOracleAddress,
  };
};
