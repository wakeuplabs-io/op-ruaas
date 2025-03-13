import { ethers } from "hardhat";

export type OrderMetadata = {
  name: string;
  artifacts?: string;
}

async function main() {
  const chain = await ethers.provider.getNetwork();
  
  const deployed_addresses = require(`../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`);
  const marketplaceAddress = deployed_addresses["MarketplaceModule#Marketplace"];
  const tokenAddress = deployed_addresses["TestToken#TestToken"];
  
  const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);
  const token = await ethers.getContractAt("TestToken", tokenAddress);

  const offerId = 0n;
  const initialCommitment = 1n;
  const metadata: OrderMetadata = {
    name: "Base",
    // if not artifacts then it's a brand new deployment
    artifacts: "QmVbzUdWgLwoDAtjz48uNT2rQh1AnjmyRXVqfK9ihmnjic"
  };
  
  // approve
  const approveTx = await token.approve(marketplaceAddress, ethers.MaxUint256);
  await approveTx.wait();

  // create order
  const createOrderTx = await marketplace.createOrder(offerId, initialCommitment, JSON.stringify(metadata));
  const receipt = await createOrderTx.wait();
  
  const event = receipt?.logs
    .map(log => {
      try {
        return marketplace.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find(event => event?.name === "NewOrder");

  if (!event) {
    throw new Error("OrderCreated event not found in transaction receipt");
  }

  const orderId = event.args.orderId;
  console.log(`Order created with tx: ${createOrderTx.hash} and orderId: ${orderId}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
