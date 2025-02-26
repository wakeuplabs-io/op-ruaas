import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Erc20 = buildModule("Erc20Module", (m) => {
  const erc20 = m.contract("TestToken", [1_000_000_000_000_000_000n]);

  return { erc20 };
});

export default Erc20;
