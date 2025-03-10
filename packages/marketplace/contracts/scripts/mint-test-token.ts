import { ethers } from "hardhat";

async function main() {
  const chain = await ethers.provider.getNetwork();
  const deployed_addresses = require(
    `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
  );
  const tokenAddress = deployed_addresses["TestToken#TestToken"];
  const token = await ethers.getContractAt("TestToken", tokenAddress);

  const tx = await token.mint("0x5Cff4762B7a50553586D52F96c11Aa65e9281D5a", 1000_000_000_000_000_000_000_000_000n);

  console.log(`Token minted with tx: ${tx.hash}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
