import {
  MARKETPLACE_ABI,
  MARKETPLACE_ADDRESS,
} from "@/shared/constants/marketplace";
import { useCallback, useState } from "react";
import { useWriteContract } from "wagmi";
import { readFile } from "../utils";
import { pinata } from "../pinata";

export const useFullFilRequest = () => {
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);

  const onFullFilRequest = useCallback(
    async (orderId: bigint, artifactsZip: File, deploymentJson: File) => {
      setIsPending(true);
      try {
        const deployment = JSON.parse(await readFile(deploymentJson));
        const contractAddresses = JSON.parse(deployment["contracts_addresses"]);
        const infraBaseUrl = deployment["infra_base_url"];
        const networkConfig = deployment["network_config"];

        const { cid: artifactsCid } =
          await pinata.upload.public.file(artifactsZip);

        const tx = await writeContractAsync({
          abi: MARKETPLACE_ABI,
          address: MARKETPLACE_ADDRESS,
          functionName: "fulfillOrder",
          args: [
            orderId,
            JSON.stringify({
              artifacts: artifactsCid,
              network: {
                l1ChainID: networkConfig["l1_chain_id"],
                l2ChainID: networkConfig["l2_chain_id"],
              },
              urls: {
                rpc: `${infraBaseUrl}/rpc`,
                monitoring: `${infraBaseUrl}/monitoring`,
                explorer: `${infraBaseUrl}`,
              },
              addresses: {
                addressManager: contractAddresses["AddressManager"],
                anchorStateRegistry: contractAddresses["AnchorStateRegistry"],
                anchorStateRegistryProxy: contractAddresses["AnchorStateRegistryProxy"],
                delayedWETH: contractAddresses["DelayedWETH"],
                delayedWETHProxy: contractAddresses["DelayedWETHProxy"],
                disputeGameFactory: contractAddresses["DisputeGameFactory"],
                disputeGameFactoryProxy: contractAddresses["DisputeGameFactoryProxy"],
                l1CrossDomainMessenger: contractAddresses["L1CrossDomainMessenger"],
                l1CrossDomainMessengerProxy: contractAddresses["L1CrossDomainMessengerProxy"],
                l1ERC721Bridge: contractAddresses["L1ERC721Bridge"],
                l1ERC721BridgeProxy: contractAddresses["L1ERC721BridgeProxy"],
                l1StandardBridge: contractAddresses["L1StandardBridge"],
                l1StandardBridgeProxy: contractAddresses["L1StandardBridgeProxy"],
                l2OutputOracle: contractAddresses["L2OutputOracle"],
                l2OutputOracleProxy: contractAddresses["L2OutputOracleProxy"],
                mips: contractAddresses["Mips"],
                optimismMintableERC20Factory: contractAddresses["OptimismMintableERC20Factory"],
                optimismMintableERC20FactoryProxy: contractAddresses["OptimismMintableERC20FactoryProxy"],
                optimismPortal: contractAddresses["OptimismPortal"],
                optimismPortal2: contractAddresses["OptimismPortal2"],
                optimismPortalProxy: contractAddresses["OptimismPortalProxy"],
                permissionedDelayedWETHProxy: contractAddresses["PermissionedDelayedWETHProxy"],
                preimageOracle: contractAddresses["PreimageOracle"],
                protocolVersions: contractAddresses["ProtocolVersions"],
                protocolVersionsProxy: contractAddresses["ProtocolVersionsProxy"],
                proxyAdmin: contractAddresses["ProxyAdmin"],
                safeProxyFactory: contractAddresses["SafeProxyFactory"],
                safeSingleton: contractAddresses["SafeSingleton"],
                superchainConfig: contractAddresses["SuperchainConfig"],
                superchainConfigProxy: contractAddresses["SuperchainConfigProxy"],
                systemConfig: contractAddresses["SystemConfig"],
                systemConfigProxy: contractAddresses["SystemConfigProxy"],
                systemOwnerSafe: contractAddresses["SystemOwnerSafe"],
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
