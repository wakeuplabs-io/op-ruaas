import { ethers } from "hardhat";

export type OfferMetadata = {
  title: string;
  features: string[];
  wallets?: {
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
      sequencer: "0xf3A77F4dA4a4Fc14E40747C4e193b0F35FfbFe4F",
      batcher: "0xf3A77F4dA4a4Fc14E40747C4e193b0F35FfbFe4F",
      challenger: "0xf3A77F4dA4a4Fc14E40747C4e193b0F35FfbFe4F",
      proposer: "0xf3A77F4dA4a4Fc14E40747C4e193b0F35FfbFe4F",
    }
  };

  const replicaMetadata = {
    title: "Ethereum",
    features: ["Run a replica node for your L2 chain", "Blockscout explorer"],
  };
  const units = 100n;

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
