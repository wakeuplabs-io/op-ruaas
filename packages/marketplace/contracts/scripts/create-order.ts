import { ethers } from "hardhat";

export type OrderMetadata = {
  name: string;
  artifacts?: string;
}

async function main() {
  const chain = await ethers.provider.getNetwork();
  const deployed_addresses = require(`../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`);
  const marketplaceAddress = deployed_addresses["MarketplaceModule#Marketplace"];
  const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);

  const offerId = 1n;
  const initialCommitment = 1n;
  const metadata: OrderMetadata = {
    name: "MyChain",
    // if not artifacts then it's a brand new deployment
    artifacts: "QmVbzUdWgLwoDAtjz48uNT2rQh1AnjmyRXVqfK9ihmnjic"
  };

  const tx = await marketplace.createOrder(offerId, initialCommitment, JSON.stringify(metadata));

  console.log(`Order created with tx: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
