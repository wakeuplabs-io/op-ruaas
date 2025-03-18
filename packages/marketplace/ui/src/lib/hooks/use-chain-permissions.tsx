import {
  L2_OUTPUT_ORACLE_ABI,
  L2_OUTPUT_ORACLE_BYTECODE,
} from "@/shared/constants/l2-output-oracle";
import { PROXY_ADMIN_ABI } from "@/shared/constants/proxy-admin";
import { SYSTEM_CONFIG_ABI } from "@/shared/constants/system-config";
import { SYSTEM_OWNER_SAFE_ABI } from "@/shared/constants/system-owner-safe";
import { useEffect, useState } from "react";
import { encodeFunctionData, pad, toBytes, toHex, zeroAddress } from "viem";
import { waitForTransactionReceipt } from "@wagmi/core";
import {
  useConfig,
  useReadContract,
  useReadContracts,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { useEnsureChain } from "./use-ensure-chain";

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
  const { ensureChainId } = useEnsureChain();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  const [permissions, setPermissions] = useState<any>({
    submissionInterval: 0n,
    l2BlockTime: 0n,
    startingBlockNumber: 0n,
    startingTimestamp: 0n,
    finalizationPeriodSeconds: 0n,
    batcher: zeroAddress,
    sequencer: zeroAddress,
    challenger: zeroAddress,
    proposer: zeroAddress,
  });
  const [pending, setPending] = useState(false);
  const config = useConfig();

  // Fetching from proxy directly doesn't quite work locally so we circunvent it
  const { data: l2OutputOracle, error: l2OutputOracleError, isPending } = useReadContract({
    address: l2OutputOracleProxy,
    abi: [
      {
        type: "function",
        name: "implementation",
        inputs: [],
        outputs: [{ name: "", type: "address", internalType: "address" }],
        stateMutability: "nonpayable",
      },
    ],
    functionName: "implementation",
    chainId: l1ChainId,
  });

  const { data } = useReadContracts({
    query: { enabled: l2OutputOracle !== undefined, refetchInterval: 1000 },
    contracts: [
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
        address: l2OutputOracle,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "submissionInterval",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracle,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "l2BlockTime",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracle,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "startingBlockNumber",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracle,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "startingTimestamp",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracle,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "finalizationPeriodSeconds",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracle,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "CHALLENGER",
        chainId: l1ChainId,
      },
      {
        address: l2OutputOracle,
        abi: L2_OUTPUT_ORACLE_ABI,
        functionName: "PROPOSER",
        chainId: l1ChainId,
      },
    ],
  });

  useEffect(() => {
    const [
      batcher,
      sequencer,
      submissionInterval,
      l2BlockTime,
      startingBlockNumber,
      startingTimestamp,
      finalizationPeriodSeconds,
      challenger,
      proposer,
    ] = data || [];

    setPermissions({
      submissionInterval: submissionInterval?.result as bigint,
      l2BlockTime: l2BlockTime?.result as bigint,
      startingBlockNumber: startingBlockNumber?.result as bigint,
      startingTimestamp: startingTimestamp?.result as bigint,
      finalizationPeriodSeconds: finalizationPeriodSeconds?.result as bigint,
      batcher: batcher?.result ?? (zeroAddress as `0x${string}`),
      sequencer: sequencer?.result ?? zeroAddress,
      challenger: challenger?.result ?? zeroAddress,
      proposer: proposer?.result ?? zeroAddress,
    });
  }, [data]);

  const setSequencerAddress = async (sequencerAddress: string) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    setPending(true);

    try {
      await ensureChainId(l1ChainId);

      const sequencerTx = await writeContractAsync({
        abi: SYSTEM_CONFIG_ABI,
        address: systemConfigProxy,
        chainId: l1ChainId,
        functionName: "setUnsafeBlockSigner",
        args: [sequencerAddress],
      });

      await waitForTransactionReceipt(config, {
        hash: sequencerTx,
        chainId: l1ChainId,
      });

      setPermissions({
        ...permissions,
        sequencer: sequencerAddress,
      });

      return sequencerTx;
    } finally {
      setPending(false);
    }
  };

  const setBatcherAddress = async (batcherAddress: string) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }
    setPending(true);

    try {
      await ensureChainId(l1ChainId);

      const batcherTx = await writeContractAsync({
        abi: SYSTEM_CONFIG_ABI,
        address: systemConfigProxy,
        chainId: l1ChainId,
        functionName: "setBatcherHash",
        args: [toHex(pad(toBytes(batcherAddress), { size: 32 }))],
      });

      await waitForTransactionReceipt(config, {
        hash: batcherTx ?? "",
        chainId: l1ChainId,
      });

      setPermissions({
        ...permissions,
        batcher: toHex(pad(toBytes(batcherAddress), { size: 32 })),
      });

      return batcherTx;
    } finally {
      setPending(false);
    }
  };

  const setOracleAddress = async (proposer: string, challenger: string) => {
    if (!walletClient) {
      throw new Error("No wallet connected");
    }

    setPending(true);

    try {
      await ensureChainId(l1ChainId);

      let implementation: `0x${string}` = zeroAddress;
      if (proposer !== zeroAddress || challenger !== zeroAddress) {
        const deployTx = await walletClient?.deployContract({
          abi: L2_OUTPUT_ORACLE_ABI,
          bytecode: L2_OUTPUT_ORACLE_BYTECODE,
          args: [
            permissions.submissionInterval,
            permissions.l2BlockTime,
            permissions.startingBlockNumber,
            permissions.startingTimestamp,
            proposer,
            challenger,
            permissions.finalizationPeriodSeconds,
          ],
        });

        const deploymentReceipt = await waitForTransactionReceipt(config, {
          hash: deployTx ?? "",
          chainId: l1ChainId,
        });
        if (!deploymentReceipt.contractAddress) {
          throw new Error("Transaction failed");
        }

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

      await waitForTransactionReceipt(config, {
        hash: upgradeTx ?? "",
        chainId: l1ChainId
      });

      setPermissions({
        ...permissions,
        proposer: proposer,
        challenger: challenger,
      });

      return upgradeTx;
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  };

  if(l2OutputOracleError || isPending) {
    return {
      setSequencerAddress,
      setBatcherAddress,
      setOracleAddress,
      batcher: null,
      sequencer: null,
      challenger: null,
      proposer: null,
      isPending: pending,
    };
  }
  return {
    setSequencerAddress,
    setBatcherAddress,
    setOracleAddress,
    batcher: permissions.batcher,
    sequencer: permissions.sequencer,
    challenger: permissions.challenger,
    proposer: permissions.proposer,
    isPending: pending,
  };
};
