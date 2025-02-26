import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MarketplaceModule = buildModule("MarketplaceModule", (m) => {
  const paymentToken = m.getParameter("PaymentToken");

  const marketplace = m.contract("Marketplace", [paymentToken]);

  return { marketplace };
});

export default MarketplaceModule;
