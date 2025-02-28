import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CreateOffer", (m) => {
  const MARKETPLACE_ADDRESS = "0x68E8907AF7219e4c172c2c985D1b7c20Bf2CA461";

  const PRICE_PER_HOUR = 1n;
  const DEPLOYMENT_FEE = 2n;
  const FULFILLMENT_TIME = 3n;
  const UNITS = 4n;

  const marketplace = m.contractAt("Marketplace", MARKETPLACE_ADDRESS);

  m.call(marketplace, "createOffer", [
    PRICE_PER_HOUR,
    DEPLOYMENT_FEE,
    FULFILLMENT_TIME,
    UNITS,
  ]);

  return { marketplace };
});
