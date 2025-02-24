import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("Marketplace", function () {
  async function deployMarketplaceFixture() {
    const [vendor, client] = await hre.ethers.getSigners();

    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy();
    const marketplaceAddress = await marketplace.getAddress();

    const Token = await hre.ethers.getContractFactory("TestToken");
    const token = await Token.connect(client).deploy(1000000n);
    const tokenAddress = await token.getAddress();

    await marketplace.initialize(await token.getAddress());

    async function vendorCreateOffer(
      pricePerHour: bigint,
      deploymentFee: bigint,
      fulfillmentTime: bigint,
      units: bigint
    ): Promise<bigint> {
      await marketplace
        .connect(vendor)
        .createOffer(pricePerHour, deploymentFee, fulfillmentTime, units);

      return (await marketplace.offerCount()) - 1n;
    }

    async function clientCreateOrder(offerId: bigint) {
      await marketplace.connect(client).createOrder(offerId, "metadata");

      return (await marketplace.orderCount()) - 1n;
    }

    async function fulfillOrder(orderId: bigint): Promise<bigint> {
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");
      const order = await marketplace.orders(orderId);

      return order.fulfilledAt;
    }

    return {
      marketplace,
      marketplaceAddress,
      token,
      tokenAddress,
      vendor,
      client,
      vendorCreateOffer,
      clientCreateOrder,
      fulfillOrder,
    };
  }

  describe("Initialize", function () {
    it("Should set the right payment token", async function () {
      const { marketplace, token } = await loadFixture(
        deployMarketplaceFixture
      );

      expect(await marketplace.paymentToken()).to.equal(
        await token.getAddress()
      );
    });

    it("Should fail if already initialized", async function () {
      const { marketplace, token } = await loadFixture(
        deployMarketplaceFixture
      );

      await expect(marketplace.initialize(await token.getAddress())).to.be
        .reverted;
    });
  });

  describe("CreateOffer", function () {
    it("Should create an offer", async function () {
      const { marketplace, vendor } = await loadFixture(
        deployMarketplaceFixture
      );

      await expect(marketplace.connect(vendor).createOffer(1n, 2n, 3n, 4n)).not.to
        .be.reverted;
    });

    it("Should emit NewOffer event", async function () {
      const { marketplace, vendor } = await loadFixture(
        deployMarketplaceFixture
      );

      const [pricePerHour, deploymentFee, fulfillmentTime, units] = [1n, 2n, 3n, 4n];
      await expect(
        marketplace
          .connect(vendor)
          .createOffer(pricePerHour, deploymentFee, fulfillmentTime, units)
      )
        .to.emit(marketplace, "NewOffer")
        .withArgs(vendor.address, 0n, pricePerHour, deploymentFee, fulfillmentTime, units);
    });
  });

  describe("SetOfferRemainingUnits", function () {
    it("Should set remaining units", async function () {
      const { marketplace, vendorCreateOffer, vendor } = await loadFixture(
        deployMarketplaceFixture
      );

      await vendorCreateOffer(1n, 2n, 3n, 4n);

      await expect(marketplace.connect(vendor).setOfferRemainingUnits(0n, 10n))
        .not.to.be.reverted;
      expect((await marketplace.offers(0n)).remainingUnits).to.equal(10n);
    });

    it("Should revert if caller is not the vendor", async function () {
      const { marketplace, client, vendorCreateOffer } = await loadFixture(
        deployMarketplaceFixture
      );

      // setup
      await vendorCreateOffer(1n, 2n, 3n, 4n);

      await expect(marketplace.connect(client).setOfferRemainingUnits(0n, 10n))
        .to.be.reverted;
    });
  });

  describe("CreateOrder", function () {
    it("Should transfer to contract initial amount", async function () {
      throw new Error("Not implemented");
    })

    it("Should revert if not enough for deployment fee", async function () {
      throw new Error("Not implemented");
    })

    it("Should emit NewOrder event", async function () {
      throw new Error("Not implemented");
    })
  });

  describe("FulfillOrder", function () {
    it("Should transfer to vendor deployment fee", async function () {
      throw new Error("Not implemented");
    })

    it("Should update fulfilledAt and lastWithdrawal", async function () {
      throw new Error("Not implemented");
    })

    it("Should emit OrderFulfilled event", async function () {
      throw new Error("Not implemented");
    })

    it("Should revert if caller is not the vendor", async function () {
      throw new Error("Not implemented");
    })
  });

  describe("TerminateOrder", function () {
    it("Should revert if order not fulfilled and within fulfillment time", async function () {
      throw new Error("Not implemented");
    })

    it("Should empty order balance", async function () {
      throw new Error("Not implemented");
    })

    it("Should revert if caller is not the vendor/client", async function () {
      throw new Error("Not implemented");
    })

    it("Should emit OrderTerminated event", async function () {
      throw new Error("Not implemented");
    })
  });

  describe("Deposit", function () {
    it("Should revert if order already terminated", async function () {
      throw new Error("Not implemented");
    })

    it("Should transfer balance to contract", async function () {
      throw new Error("Not implemented");
    })

    it("Should emit Deposit event", async function () {
      throw new Error("Not implemented");
    })
  });

  describe("Withdraw", function () {
    it("Should revert if order already terminated", async function () {
      throw new Error("Not implemented");
    })

    it("Should revert if not fulfilled and within fulfillment time", async function () {
      throw new Error("Not implemented");
    })

    it("Should transfer balance to caller", async function () {
      throw new Error("Not implemented");
    })

    it("Should emit Withdraw event", async function () {
      throw new Error("Not implemented");
    })

    it("Should update lastWithdrawal", async function () {
      throw new Error("Not implemented");
    })

    it("Should revert if trying to withdraw more than allowed", async function () {
      throw new Error("Not implemented");
    })
  });

  describe("BalanceOf", function () {
    it("Should return all balance if not fulfilled", async function () {
      throw new Error("Not implemented");
    })

    it("Should return 0 if terminated", async function () {
      throw new Error("Not implemented");
    })

    it("Should return max withdrawal balance for client and vendor", async function () {
      throw new Error("Not implemented");
    })

    it("Should return balance if accumulated exceeds it", async function () {
      throw new Error("Not implemented");
    })
  });
});
