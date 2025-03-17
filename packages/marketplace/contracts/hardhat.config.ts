import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

import "./tasks/token"
import "./tasks/marketplace"

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    "op-sepolia": {
      url: process.env.RPC_OP_SEPOLIA || "https://sepolia.optimism.io", 
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};

export default config;
