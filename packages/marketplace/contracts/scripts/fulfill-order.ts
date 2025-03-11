import { ethers } from "hardhat";

async function main() {
  const chain = await ethers.provider.getNetwork();
  const deployed_addresses = require(
    `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
  );

  const marketplace = await ethers.getContractAt(
    "Marketplace",
    deployed_addresses["MarketplaceModule#Marketplace"]
  );
  const orderId = 0n;

  const tx = await marketplace.fulfillOrder(
    orderId,
    JSON.stringify({
      network: { l1ChainId: 1n, /* ... */ },
      artifacts: "QmVbzUdWgLwoDAtjz48uNT2rQh1AnjmyRXVqfK9ihmnjic",
      addresses: {
         /* ... */
        systemConfigProxy: "0x123",
        l2OutputOracleProxy: "0x123",
        systemOwnerSafe: "0x123",
        proxyAdmin: "0x123",
      },
    })
  );
  const receipt = await tx.wait();

  const offerId = (receipt?.logs[0] as any).args[1];
  console.log(`Offer created with OfferId: ${offerId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
