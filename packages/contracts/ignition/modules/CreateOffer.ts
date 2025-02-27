import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CreateOffer", (m) => {
  const MARKETPLACE_ADDRESS = "0x232d520FD20C8fE0B6CE27A844653a0eC09298ea";

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
