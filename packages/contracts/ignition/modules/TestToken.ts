import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestToken = buildModule("TestToken", (m) => {
  const token = m.contract("TestToken", [1_000_000_000_000_000_000_000_000n]);

  return { token };
});

export default TestToken;
