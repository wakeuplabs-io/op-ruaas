import { ethers } from "hardhat";

export type OfferMetadata = {
  title: string;
  features: string[];
  wallets: {
    sequencer: string;
    batcher: string;
    challenger: string;
    proposer: string;
  };
}

async function main() {
  const chain = await ethers.provider.getNetwork();
  const deployed_addresses = require(`../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`);
  const marketplaceAddress = deployed_addresses["MarketplaceModule#Marketplace"];
  const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);

  const pricePerMonth = 10n * 10n ** 18n;
  const sequencerMetadata = {
    title: "Ethereum",
    features: ["Deploy contracts on Ethereum as L1", "Run your L2 chain", "Runs Blockscout explorer"],
    wallets: {
      sequencer: "0x0000000000000000000000000000000000000000",
      batcher: "0x0000000000000000000000000000000000000000",
      challenger: "0x0000000000000000000000000000000000000000",
      proposer: "0x0000000000000000000000000000000000000000",
    }
  };

  const replicaMetadata = {
    title: "Ethereum",
    features: ["Run a replica node for your L2 chain", "Blockscout explorer"],
  };
  const units = 10n;

  const tx = await marketplace.createOffer(pricePerMonth, units, JSON.stringify(replicaMetadata));
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
