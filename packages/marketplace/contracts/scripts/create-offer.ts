import { ethers } from "hardhat";

async function main() {
  const chain = await ethers.provider.getNetwork();
  const deployed_addresses = require(`../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`);

  const marketplaceAddress = deployed_addresses["MarketplaceModule#Marketplace"];
  const pricePerMonth = 10n * 10n ** 18n;
  const metadata = '{}';
  const units = 10n;

  const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);

  const tx = await marketplace.createOffer(pricePerMonth, units, metadata);
  await tx.wait();

  console.log("Offer successfully created:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
