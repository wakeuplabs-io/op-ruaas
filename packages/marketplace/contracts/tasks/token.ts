import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";

task("mint", "Mints test tokens to a specified address")
  .addParam("amount", "Tokens to mint")
  .addParam("to", "The address to mint tokens to")
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      const chain = await hre.ethers.provider.getNetwork();
      const deployed_addresses = require(
        `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
      );
      const tokenAddress = deployed_addresses["TestToken#TestToken"];
      const token = await hre.ethers.getContractAt("TestToken", tokenAddress);
      const tokenDecimals = await token.decimals();

      console.log(`Minting ${taskArguments.amount} to ${taskArguments.to}`);

      const tx = await token.mint(taskArguments.to, taskArguments.amount * 10n ** tokenDecimals);

      console.log(`Token minted with tx: ${tx.hash}`);
    }
  );
