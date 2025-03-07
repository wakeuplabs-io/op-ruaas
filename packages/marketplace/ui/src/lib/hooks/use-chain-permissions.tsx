import {
  L2_OUTPUT_ORACLE_ABI,
  L2_OUTPUT_ORACLE_BYTECODE,
} from "@/shared/constants/l2-output-oracle";
import { PROXY_ADMIN_ABI } from "@/shared/constants/proxy-admin";
import { SYSTEM_CONFIG_ABI } from "@/shared/constants/system-config";
import { SYSTEM_OWNER_SAFE_ABI } from "@/shared/constants/system-owner-safe";
import { useMemo } from "react";
import { encodeFunctionData, pad, toBytes, zeroAddress } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useReadContracts, useWalletClient, useWriteContract } from "wagmi";

export const useChainPermissions = ({
  l1ChainId,
  systemConfigProxy,
  systemOwnerSafe,
  l2OutputOracleProxy,
  proxyAdmin,
}: {
  l1ChainId: number;
  systemConfigProxy: `0x${string}`;
  l2OutputOracleProxy: `0x${string}`;
  systemOwnerSafe: `0x${string}`;
  proxyAdmin: `0x${string}`;
}) => {
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();

  const { data, isLoading, isError } = useReadContracts({
    contracts: [
      {
        address: l2OutputOracleProxy,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "submissionInterval",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracleProxy,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "l2BlockTime",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracleProxy,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "startingBlockNumber",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracleProxy,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "startingTimestamp",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracleProxy,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "finalizationPeriodSeconds",
        chainId: l1ChainId,
      },
      {
        address: systemConfigProxy,
        abi: SYSTEM_CONFIG_ABI,
        functionName: "batcherHash",
        chainId: l1ChainId,
      },
      {
        address: systemConfigProxy,
        abi: SYSTEM_CONFIG_ABI,
        functionName: "unsafeBlockSigner",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracleProxy,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "CHALLENGER",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracleProxy,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "PROPOSER",
        chainId: l1ChainId,
      },
    ],
  });

  const {
    submissionInterval,
    l2BlockTime,
    startingBlockNumber,
    startingTimestamp,
    finalizationPeriodSeconds,
    batcher,
    sequencer,
    challenger,
    proposer,
  } = useMemo(() => {
    const [
      submissionInterval,
      l2BlockTime,
      startingBlockNumber,
      startingTimestamp,
      finalizationPeriodSeconds,
      batcher,
      sequencer,
      challenger,
      proposer,
    ] = data || [];

    return {
      submissionInterval: submissionInterval?.result,
      l2BlockTime: l2BlockTime?.result,
      startingBlockNumber: startingBlockNumber?.result,
      startingTimestamp: startingTimestamp?.result,
      finalizationPeriodSeconds: finalizationPeriodSeconds?.result,
      batcher: batcher?.result ?? zeroAddress,
      sequencer: sequencer?.result ?? zeroAddress,
      challenger: challenger?.result ?? zeroAddress,
      proposer: proposer?.result ?? zeroAddress,
    };
  }, [data, isLoading, isError]);

  const setSequencerAddress = async (sequencerAddress: string) => {
    const sequencerTx = await writeContractAsync({
      abi: SYSTEM_CONFIG_ABI,
      address: systemConfigProxy,
      chainId: l1ChainId,
      functionName: "setUnsafeBlockSigner",
      args: [sequencerAddress],
    });

    return sequencerTx;
  };

  const setBatcherAddress = async (batcherAddress: string) => {
    const batcherTx = await writeContractAsync({
      abi: SYSTEM_CONFIG_ABI,
      address: systemConfigProxy,
      chainId: l1ChainId,
      functionName: "setBatcherHash",
      args: [pad(toBytes(batcherAddress), { size: 32 })],
    });

    return batcherTx;
  };

  const setOracleAddress = async (proposer: string, challenger: string) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    let implementation: `0x${string}` = zeroAddress;
    if (proposer !== zeroAddress || challenger !== zeroAddress) {
      const deployTx = await walletClient?.deployContract({
        abi: L2_OUTPUT_ORACLE_ABI,
        bytecode: L2_OUTPUT_ORACLE_BYTECODE,
      });
      const deploymentReceipt = await waitForTransactionReceipt(walletClient, {
        hash: deployTx ?? "",
      });
      if (!deploymentReceipt.contractAddress) {
        throw new Error("Transaction failed");
      }

      // Initialize the L2OutputOracle
      await writeContractAsync({
        abi: L2_OUTPUT_ORACLE_ABI,
        address: deploymentReceipt.contractAddress,
        chainId: l1ChainId,
        functionName: "initialize",
        args: [
          submissionInterval,
          l2BlockTime,
          startingBlockNumber,
          startingTimestamp,
          proposer,
          challenger,
          finalizationPeriodSeconds,
        ],
      });

      implementation = deploymentReceipt.contractAddress;
    }

    // set new proxy
    const upgradeTx = await writeContractAsync({
      abi: SYSTEM_OWNER_SAFE_ABI,
      address: systemOwnerSafe,
      chainId: l1ChainId,
      functionName: "execTransaction",
      args: [
        proxyAdmin,
        "0x00",
        encodeFunctionData({
          abi: PROXY_ADMIN_ABI,
          functionName: "upgrade",
          args: [l2OutputOracleProxy, implementation],
        }),
        "0",
        "0",
        "0",
        "0",
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        "0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000000001",
      ],
    });

    return upgradeTx;
  };

  return {
    setSequencerAddress,
    setBatcherAddress,
    setOracleAddress,
    batcher,
    sequencer,
    challenger,
    proposer,
  };
};
