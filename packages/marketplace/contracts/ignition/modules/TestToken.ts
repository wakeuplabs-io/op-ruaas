import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestToken = buildModule("TestToken", (m) => {
  const initialSupply = BigInt(1000000 * 10 ** 18);
  const token = m.contract("TestToken", [initialSupply]);

  return { token };
});

export default TestToken;
