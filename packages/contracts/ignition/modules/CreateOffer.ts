import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CreateOffer", (m) => {
  const marketplaceAddress = m.getParameter<string>("MarketplaceAddress");
  const pricePerHour = m.getParameter<bigint>("PricePerHour");
  const deploymentFee = m.getParameter<bigint>("DeploymentFee");
  const fulfillmentTime = m.getParameter<bigint>("FulfillmentTime");
  const units = m.getParameter<bigint>("Units");

  const marketplace = m.contractAt("Marketplace", marketplaceAddress);

  m.call(marketplace, "createOffer", [
    pricePerHour,
    deploymentFee,
    fulfillmentTime,
    units,
  ]);

  return { marketplace };
});
