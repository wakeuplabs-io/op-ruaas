import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
} from "@/shared/constants/marketplace";
import { useCallback, useState } from "react";
import { useWriteContract } from "wagmi";

export const useFullFilRequest = () => {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);

  const onFullFilRequest = useCallback(
    async (orderId: bigint, artifactsZip: File, deploymentJson: File) => {
      setIsPending(true);
      try {
        const tx = await writeContractAsync({
          abi: MARKETPLACE_ABI,
          address: MARKETPLACE_ADDRESS,
          functionName: "fulfillOrder",
          args: [
            orderId,
            JSON.stringify({
              artifacts:
                "bafybeidymwtifzgtikwbklqjvzyi6eytzqfgjjgx4zx26rvaornpe2l4qq",
              network: { l1ChainID: 1, l2ChainID: 1201101712 },
              urls: {
                rpc: "https://base.provider.com/rpc",
                explorer: "https://base.provider.com/explorer",
                monitoring: "https://base.provider.com/moniroting",
              },
              addresses: {
                addressManager: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
                anchorStateRegistry:
                  "0xC6f6F7B41F54F0DC477760fE616c5C57ADFaAB25",
                anchorStateRegistryProxy:
                  "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
                delayedWETH: "0x587c299C6518136439FeF4846F53616AdF6dB224",
                delayedWETHProxy: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
                disputeGameFactory:
                  "0x8Da2B74872310fc4B34De6d50090f4a37A903dAF",
                disputeGameFactoryProxy:
                  "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
                l1CrossDomainMessenger:
                  "0x6580B871086be7c659b1292823387A8F3Ded5667",
                l1CrossDomainMessengerProxy:
                  "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE",
                l1ERC721Bridge: "0xCC2eD03606d492f06303B220DCAe8b5520Fd1cd1",
                l1ERC721BridgeProxy:
                  "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c",
                l1StandardBridge: "0x5028A032461a4b01406340b8fc0BaC25b628ba28",
                l1StandardBridgeProxy:
                  "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
                l2OutputOracle: "0xca166C13d76FE50b11Aa3FAE5548cAAD5F824626",
                l2OutputOracleProxy:
                  "0x59b670e9fA9D0A427751Af201D676719a970857b",
                mips: "0x9360275247D3c0cf12C5cE044201FDE67b75AbD8",
                optimismMintableERC20Factory:
                  "0x8E0077027adAFae493cbd782d25a21eB1F969ddc",
                optimismMintableERC20FactoryProxy:
                  "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
                optimismPortal: "0xBEd9faF8dDE65b31Bab7Cf8571098Bef5E96F3c3",
                optimismPortal2: "0x136ecFcf56c0E3ef951B4B0f18ab82Fa93349a09",
                optimismPortalProxy:
                  "0x9A676e781A523b5d0C0e43731313A708CB607508",
                permissionedDelayedWETHProxy:
                  "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
                preimageOracle: "0xF82C42E4bc17FCE50D9Aa72060FC7B00ADfBb348",
                protocolVersions: "0x21452cBa7b41F96b06Dfe1F21227d843a16977DE",
                protocolVersionsProxy:
                  "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
                proxyAdmin: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
                safeProxyFactory: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
                safeSingleton: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
                superchainConfig: "0xC91110fde34B3EA47d72e2099b7aA7573fd5FAC4",
                superchainConfigProxy:
                  "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
                systemConfig: "0xd61ae005C47E58a5DaF10c903365090B5cd72394",
                systemConfigProxy: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
                systemOwnerSafe: "0x4CC094Fb7f6EC7Aa7D18b748cDC64bFd84d6fC85",
              },
            }),
          ],
        });
        return tx;
      } catch (e) {
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [setIsPending, writeContractAsync]
  );

  return { onFullFilRequest, isPending };
};
