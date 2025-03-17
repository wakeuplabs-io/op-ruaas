import { useMemo } from "react";
import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
  MARKETPLACE_CHAIN_ID,
} from "@/shared/constants/marketplace";
import { useWalletClient, useWriteContract } from "wagmi";
import { useEnsureChain } from "./use-ensure-chain";
import { useOrderDetails } from "./use-order";
import { useChainPermissions } from "./use-chain-permissions";
import { zeroAddress } from "viem";

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
  const { data } = useOrderDetails({ id: orderId });
  const { ensureChainId } = useEnsureChain();

  const isSubscribed = useMemo(() => {
    if (!data) return false;
    return data.order.terminatedAt == 0n;
  }, [data]);

  const {
    batcher,
    sequencer,
    proposer,
    challenger,
  } = useChainPermissions({
    l1ChainId: Number(data?.order.deploymentMetadata.network.l1ChainID ?? 0),
    systemConfigProxy:
      data?.order.deploymentMetadata.addresses.systemConfigProxy ?? zeroAddress,
    l2OutputOracleProxy:
      data?.order.deploymentMetadata.addresses.l2OutputOracleProxy ??
      zeroAddress,
    systemOwnerSafe:
      data?.order.deploymentMetadata.addresses.systemOwnerSafe ?? zeroAddress,
    proxyAdmin:
      data?.order.deploymentMetadata.addresses.proxyAdmin ?? zeroAddress,
  });


  const provider = useMemo(() => {
    return {
      batcher: data?.offer.metadata.wallets?.batcher ?? zeroAddress,
      sequencer: data?.offer.metadata.wallets?.sequencer ?? zeroAddress,
      proposer: data?.offer.metadata.wallets?.proposer ?? zeroAddress,
      challenger: data?.offer.metadata.wallets?.challenger ?? zeroAddress,
    };
  }, [data?.offer.metadata]);

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
