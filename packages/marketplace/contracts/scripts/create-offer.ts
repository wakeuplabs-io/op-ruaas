import { ethers } from "hardhat";

async function main() {
  const marketplaceAddress = "0x74cC0e67a5720A0b4a4082d70B8646900A24e5AC";
  const pricePerMonth = 10n * 10n ** 18n;
  const metadata = '{}';
  const units = 10n;

  const marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);

  console.log("Creating offer in marketplace:", marketplaceAddress);

  const tx = await marketplace.createOffer(pricePerMonth, units, metadata);
  await tx.wait();

  console.log("Offer succesfully created:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
