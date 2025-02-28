import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CreateOffer", (m) => {
  const marketplaceAddress = m.getParameter<string>("MarketplaceAddress");
  const pricePerMonth = m.getParameter<bigint>("PricePerMonth");
  const metadata = m.getParameter<bigint>("Metadata");
  const units = m.getParameter<bigint>("Units");

  const marketplace = m.contractAt("Marketplace", marketplaceAddress);

  m.call(marketplace, "createOffer", [
    pricePerMonth,
    units,
    metadata,
  ]);

  return { marketplace };
});
