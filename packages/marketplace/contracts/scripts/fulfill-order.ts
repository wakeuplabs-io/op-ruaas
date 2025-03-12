import { ethers } from "hardhat";

export type FulfillOrderMetadata = {
  artifacts: string;
  network: {
    l1ChainID: number;
    l2ChainID: number;
  };
  addresses: {
    [key: string]: string;
  };
}

async function main() {
  const chain = await ethers.provider.getNetwork();
  const deployed_addresses = require(
    `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
  );

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    deployed_addresses["MarketplaceModule#Marketplace"]
  );
  const orderId = 21n;

  const tx = await marketplace.fulfillOrder(
    orderId,
    JSON.stringify({
      artifacts: "bafybeidymwtifzgtikwbklqjvzyi6eytzqfgjjgx4zx26rvaornpe2l4qq",
      // these are actually optional, we could fetch the file and read from there
      network: { l1ChainID: 1, l2ChainID: 1201101712  },
      addresses: {
        AddressManager: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
        AnchorStateRegistry: "0xC6f6F7B41F54F0DC477760fE616c5C57ADFaAB25",
        AnchorStateRegistryProxy: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
        DelayedWETH: "0x587c299C6518136439FeF4846F53616AdF6dB224",
        DelayedWETHProxy: "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1",
        DisputeGameFactory: "0x8Da2B74872310fc4B34De6d50090f4a37A903dAF",
        DisputeGameFactoryProxy: "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d",
        L1CrossDomainMessenger: "0x6580B871086be7c659b1292823387A8F3Ded5667",
        L1CrossDomainMessengerProxy:
          "0x9A9f2CCfdE556A7E9Ff0848998Aa4a0CFD8863AE",
        L1ERC721Bridge: "0xCC2eD03606d492f06303B220DCAe8b5520Fd1cd1",
        L1ERC721BridgeProxy: "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c",
        L1StandardBridge: "0x5028A032461a4b01406340b8fc0BaC25b628ba28",
        L1StandardBridgeProxy: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
        L2OutputOracle: "0xca166C13d76FE50b11Aa3FAE5548cAAD5F824626",
        L2OutputOracleProxy: "0x59b670e9fA9D0A427751Af201D676719a970857b",
        Mips: "0x9360275247D3c0cf12C5cE044201FDE67b75AbD8",
        OptimismMintableERC20Factory:
          "0x8E0077027adAFae493cbd782d25a21eB1F969ddc",
        OptimismMintableERC20FactoryProxy:
          "0x68B1D87F95878fE05B998F19b66F4baba5De1aed",
        OptimismPortal: "0xBEd9faF8dDE65b31Bab7Cf8571098Bef5E96F3c3",
        OptimismPortal2: "0x136ecFcf56c0E3ef951B4B0f18ab82Fa93349a09",
        OptimismPortalProxy: "0x9A676e781A523b5d0C0e43731313A708CB607508",
        PermissionedDelayedWETHProxy:
          "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44",
        PreimageOracle: "0xF82C42E4bc17FCE50D9Aa72060FC7B00ADfBb348",
        ProtocolVersions: "0x21452cBa7b41F96b06Dfe1F21227d843a16977DE",
        ProtocolVersionsProxy: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",
        ProxyAdmin: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
        SafeProxyFactory: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        SafeSingleton: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        SuperchainConfig: "0xC91110fde34B3EA47d72e2099b7aA7573fd5FAC4",
        SuperchainConfigProxy: "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6",
        SystemConfig: "0xd61ae005C47E58a5DaF10c903365090B5cd72394",
        SystemConfigProxy: "0x0B306BF915C4d645ff596e518fAf3F9669b97016",
        SystemOwnerSafe: "0x4CC094Fb7f6EC7Aa7D18b748cDC64bFd84d6fC85",
      },
    })
  );
  await tx.wait();

  console.log(`Fulfilled order ${orderId} in tx ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
