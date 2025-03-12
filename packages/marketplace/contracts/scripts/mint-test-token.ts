import { ethers } from "hardhat";

async function main() {
  const chain = await ethers.provider.getNetwork();
  const deployed_addresses = require(
    `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
  );
  const tokenAddress = deployed_addresses["TestToken#TestToken"];
  const token = await ethers.getContractAt("TestToken", tokenAddress);

  const tx = await token.mint("0x3e24adA7AcD59223147b2bbc7BE2fB4cA03303F9", 1000_000_000_000_000_000_000_000_000n);

  console.log(`Token minted with tx: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
