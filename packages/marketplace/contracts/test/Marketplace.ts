import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

// test constants
const PRICE_PER_MONTH = 100n;
const UNITS = 100n;
const INITIAL_COMMITMENT = 1n;
const OFFER_METADATA = "ipfs://...";
const ORDER_METADATA = "ipfs://...";

describe("Marketplace", function () {
  async function deployMarketplaceFixture() {
    const [vendor, client, other] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("TestToken");
    const token = await Token.connect(client).deploy(1000000n);
    const tokenAddress = await token.getAddress();

    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(tokenAddress);
    const marketplaceAddress = await marketplace.getAddress();
    await token.connect(client).approve(marketplaceAddress, 1000000n);

    async function vendorCreateOffer(): Promise<bigint> {
      await marketplace
        .connect(vendor)
        .createOffer(PRICE_PER_MONTH, UNITS, OFFER_METADATA);

      return (await marketplace.offerCount()) - 1n;
    }

    async function clientCreateOrder(offerId: bigint) {
      await marketplace
        .connect(client)
        .createOrder(offerId, INITIAL_COMMITMENT, ORDER_METADATA);

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
      other,
      vendorCreateOffer,
      clientCreateOrder,
      fulfillOrder,
    };
  }

  describe("Constructor", function () {
    it("Should set the right payment token", async function () {
      const { marketplace, token } = await loadFixture(
        deployMarketplaceFixture
      );

      // act and assert
      expect(await marketplace.paymentToken()).to.equal(
        await token.getAddress()
      );
    });
  });

  describe("CreateOffer", function () {
    it("Should create an offer", async function () {
      const { marketplace, vendor } = await loadFixture(
        deployMarketplaceFixture
      );

      // act and assert
      await expect(
        marketplace
          .connect(vendor)
          .createOffer(PRICE_PER_MONTH, UNITS, OFFER_METADATA)
      ).not.to.be.reverted;
    });

    it("Should emit NewOffer event", async function () {
      const { marketplace, vendor } = await loadFixture(
        deployMarketplaceFixture
      );

      // act and assert
      await expect(
        marketplace
          .connect(vendor)
          .createOffer(PRICE_PER_MONTH, UNITS, OFFER_METADATA)
      )
        .to.emit(marketplace, "NewOffer")
        .withArgs(vendor.address, 1n, PRICE_PER_MONTH, UNITS);
    });
  });

  describe("SetOfferRemainingUnits", function () {
    it("Should set remaining units", async function () {
      const { marketplace, vendorCreateOffer, vendor } = await loadFixture(
        deployMarketplaceFixture
      );
      const offerId = await vendorCreateOffer();

      // act and assert
      await expect(
        marketplace.connect(vendor).setOfferRemainingUnits(offerId, 10n)
      ).not.to.be.reverted;
      expect((await marketplace.offers(offerId)).remainingUnits).to.equal(10n);
    });

    it("Should revert if caller is not the vendor", async function () {
      const { marketplace, client, vendorCreateOffer } = await loadFixture(
        deployMarketplaceFixture
      );
      const offerId = await vendorCreateOffer();

      // act and assert
      await expect(
        marketplace.connect(client).setOfferRemainingUnits(offerId, 10n)
      ).to.be.reverted;
    });
  });

  describe("CreateOrder", function () {
    it("Should transfer to contract initial commitment * price per month", async function () {
      const {
        marketplace,
        marketplaceAddress,
        client,
        token,
        vendorCreateOffer,
      } = await loadFixture(deployMarketplaceFixture);
      const offerId = await vendorCreateOffer();

      // act and assert
      await expect(
        marketplace
          .connect(client)
          .createOrder(offerId, INITIAL_COMMITMENT, ORDER_METADATA)
      ).not.to.be.reverted;
      expect((await marketplace.orders(1n)).balance).to.equal(
        INITIAL_COMMITMENT * PRICE_PER_MONTH
      );
      expect((await marketplace.offers(offerId)).remainingUnits).to.equal(
        UNITS - 1n
      );
      expect(await token.balanceOf(marketplaceAddress)).to.equal(
        INITIAL_COMMITMENT * PRICE_PER_MONTH
      );
    });

    it("Should emit NewOrder event", async function () {
      const { marketplace, client, vendor, vendorCreateOffer } =
        await loadFixture(deployMarketplaceFixture);
      const offerId = await vendorCreateOffer();

      // act and assert
      await expect(
        marketplace
          .connect(client)
          .createOrder(offerId, INITIAL_COMMITMENT, ORDER_METADATA)
      )
        .to.emit(marketplace, "NewOrder")
        .withArgs(vendor.address, client.address, offerId);
    });
  });

  describe("FulfillOrder", function () {
    it("Should update fulfilledAt and metadata", async function () {
      const { marketplace, vendor, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act
      const tx = await marketplace
        .connect(vendor)
        .fulfillOrder(orderId, "metadata");
      const block = await tx.getBlock();

      // act and assert
      expect((await marketplace.orders(orderId)).fulfilledAt).to.equal(
        block?.timestamp
      );
    });

    it("Should revert if already fulfilled", async function () {
      const { marketplace, vendor, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // act and assert
      await expect(
        marketplace.connect(vendor).fulfillOrder(orderId, "metadata")
      ).to.be.reverted;
    });

    it("Should emit OrderFulfilled event", async function () {
      const {
        marketplace,
        vendor,
        client,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      await expect(
        marketplace.connect(vendor).fulfillOrder(orderId, "metadata")
      )
        .to.emit(marketplace, "OrderFulfilled")
        .withArgs(vendor.address, client.address, orderId);
    });

    it("Should revert if caller is not the vendor", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      await expect(
        marketplace.connect(client).fulfillOrder(orderId, "metadata")
      ).to.be.reverted;
    });
  });

  describe("TerminateOrder", function () {
    it("Should transfer out the remaining balance with months as minimum units", async function () {
      const {
        marketplace,
        client,
        vendor,
        token,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      const clientBalanceBefore = await token.balanceOf(client.address);
      const vendorBalanceBefore = await token.balanceOf(vendor.address);

      // travel forward in time one hour to get exactly one payment in
      await time.increaseTo(
        (await marketplace.orders(orderId)).fulfilledAt! +
          (await marketplace.VERIFICATION_PERIOD())
      );

      // pending withdrawals
      const pendingClientBalance = await marketplace.balanceOf(
        await client.getAddress(),
        orderId
      );
      const pendingVendorBalance = await marketplace.balanceOf(
        await vendor.getAddress(),
        orderId
      );

      // act
      await marketplace.connect(client).terminateOrder(orderId);

      const clientBalanceAfter = await token.balanceOf(client.address);
      const vendorBalanceAfter = await token.balanceOf(vendor.address);

      // assert
      expect(vendorBalanceAfter - vendorBalanceBefore).to.equal(
        pendingVendorBalance
      );
      expect(clientBalanceAfter - clientBalanceBefore).to.equal(
        pendingClientBalance
      );
    });

    it("Should revert if caller is not the vendor/client", async function () {
      const {
        marketplace,
        other,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // act and assert
      await expect(marketplace.connect(other).terminateOrder(orderId)).to.be
        .reverted;
    });

    it("Should emit OrderTerminated event", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // act and assert
      await expect(marketplace.connect(vendor).terminateOrder(orderId))
        .to.emit(marketplace, "OrderTerminated")
        .withArgs(vendor.address, client.address, orderId);
    });

    it("Should revert if order not fulfilled and within FULFILLMENT_PERIOD", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      await expect(marketplace.connect(client).terminateOrder(orderId)).to.be
        .reverted;
    });

    it("Should reimburse it all to client if FULFILLMENT_PERIOD passed and within VERIFICATION_PERIOD", async function () {
      const {
        marketplace,
        client,
        vendor,
        token,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      const orderBalanceBefore = (await marketplace.orders(orderId)).balance;
      const clientBalanceBefore = await token.balanceOf(client.address);

      // act and assert
      await marketplace.connect(client).terminateOrder(orderId);

      const orderBalanceAfter = (await marketplace.orders(orderId)).balance;
      const clientBalanceAfter = await token.balanceOf(client.address);

      expect(clientBalanceAfter - clientBalanceBefore).to.equal(
        orderBalanceBefore
      );
      expect(orderBalanceAfter).to.equal(0n);
    });

    it("Should allow termination if FULFILLMENT_PERIOD has passed and order is not fulfilled", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } =
      await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await time.increase(await marketplace.FULFILLMENT_PERIOD());
      await expect(marketplace.connect(client).terminateOrder(orderId)).to.not.be.reverted;
    });
    
  });

  describe("Deposit", function () {
    it("Should revert if order already terminated", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");
      await marketplace.connect(vendor).terminateOrder(orderId);

      // act and assert
      await expect(marketplace.connect(client).deposit(orderId, 10n)).to.be
        .reverted;
    });

    it("Should transfer balance to contract", async function () {
      const {
        marketplace,
        marketplaceAddress,
        client,
        token,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      const marketplaceBalanceBefore =
        await token.balanceOf(marketplaceAddress);
      const orderBalanceBefore = (await marketplace.orders(orderId)).balance;

      // act
      await marketplace.connect(client).deposit(orderId, 10n);

      const marketplaceBalanceAfter = await token.balanceOf(marketplaceAddress);
      const orderBalanceAfter = (await marketplace.orders(orderId)).balance;

      // assert
      expect(marketplaceBalanceAfter).to.equal(marketplaceBalanceBefore + 10n);
      expect(orderBalanceAfter).to.equal(orderBalanceBefore + 10n);
    });

    it("Should emit Deposit event", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // act and assert
      await expect(marketplace.connect(client).deposit(orderId, 10n))
        .to.emit(marketplace, "Deposit")
        .withArgs(orderId, 10n);
    });
  });

  describe("Withdraw", function () {
    it("Should revert if order already terminated", async function () {
      const { marketplace, vendor, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");
      await marketplace.connect(vendor).terminateOrder(orderId);

      // act and assert
      await expect(marketplace.connect(vendor).withdraw(orderId, 10n)).to.be
        .reverted;
    });

    it("Should revert if not fulfilled and within fulfillment time", async function () {
      const { marketplace, vendor, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      await expect(marketplace.connect(vendor).withdraw(orderId, 10n)).to.be
        .reverted;
    });

    it("Should revert if within verification time", async function () {
      const { marketplace, vendor, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // act
      await expect(marketplace.connect(vendor).withdraw(orderId, 10n)).to.be
        .reverted;
    });

    it("Should revert if not vendor", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // act
      await expect(marketplace.connect(client).withdraw(orderId, 10n)).to.be
        .reverted;
    });

    it("Should transfer balance to vendor", async function () {
      const {
        marketplace,
        vendor,
        token,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // advance time verification period
      await time.increaseTo(
        (await marketplace.orders(orderId)).fulfilledAt +
          (await marketplace.VERIFICATION_PERIOD())
      );

      const vendorBalanceBefore = await token.balanceOf(vendor.address);
      const orderBalanceBefore = (await marketplace.orders(orderId)).balance;

      // act
      await marketplace.connect(vendor).withdraw(orderId, 10n);

      const vendorBalanceAfter = await token.balanceOf(vendor.address);
      const orderBalanceAfter = (await marketplace.orders(orderId)).balance;

      // assert
      expect(vendorBalanceAfter).to.equal(vendorBalanceBefore + 10n);
      expect(orderBalanceAfter).to.equal(orderBalanceBefore - 10n);
    });

    it("Should emit Withdraw event", async function () {
      const { marketplace, vendor, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // advance time verification period
      await time.increaseTo(
        (await marketplace.orders(orderId)).fulfilledAt +
          (await marketplace.VERIFICATION_PERIOD())
      );

      // act
      await expect(marketplace.connect(vendor).withdraw(orderId, 10n))
        .to.emit(marketplace, "Withdrawal")
        .withArgs(vendor.address, orderId, 10n);
    });

    it("Should revert if trying to withdraw more than allowed", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");

      // act
      await expect(marketplace.connect(client).withdraw(orderId, 100000000000n))
        .to.be.reverted;
    });
  });

  describe("BalanceOf", function () {
    it("Should return all balance if not fulfilled", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      expect(
        await marketplace.balanceOf(await client.getAddress(), orderId)
      ).to.equal(INITIAL_COMMITMENT * PRICE_PER_MONTH);
      expect(
        await marketplace.balanceOf(await vendor.getAddress(), orderId)
      ).to.equal(0n);
    });

    it("Should return 0 if terminated", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");
      await marketplace.connect(vendor).terminateOrder(orderId);

      // act and assert
      expect(
        await marketplace.balanceOf(await client.getAddress(), orderId)
      ).to.equal(0n);
      expect(
        await marketplace.balanceOf(await vendor.getAddress(), orderId)
      ).to.equal(0n);
    });

    it("Should return max withdrawal balance for client and vendor", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      expect(
        await marketplace.balanceOf(await client.getAddress(), orderId)
      ).to.equal(INITIAL_COMMITMENT * PRICE_PER_MONTH);
      expect(
        await marketplace.balanceOf(await vendor.getAddress(), orderId)
      ).to.equal(0n);

      // fullfill and travel forward in time one hour to get exactly one payment in
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");
      await time.increaseTo(
        (await marketplace.orders(orderId)).fulfilledAt! + 1n
      );

      // act and assert
      expect(
        await marketplace.balanceOf(await client.getAddress(), orderId)
      ).to.equal(INITIAL_COMMITMENT * PRICE_PER_MONTH - PRICE_PER_MONTH);
      expect(
        await marketplace.balanceOf(await vendor.getAddress(), orderId)
      ).to.equal(PRICE_PER_MONTH); // deployment fee already withdrawn on fulfillment
    });

    it("Should return balance if accumulated exceeds it", async function () {
      const {
        marketplace,
        client,
        vendor,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // fulfill and travel forward in time one hour to get exactly one payment in
      await marketplace.connect(vendor).fulfillOrder(orderId, "metadata");
      await time.increaseTo(
        (await marketplace.orders(orderId)).fulfilledAt! * 1000n // Sure not enough money deposited
      );

      // act and assert
      expect(
        await marketplace.balanceOf(await client.getAddress(), orderId)
      ).to.equal(0n);
      expect(
        await marketplace.balanceOf(await vendor.getAddress(), orderId)
      ).to.equal(INITIAL_COMMITMENT * PRICE_PER_MONTH); // deployment fee already withdrawn on fulfillment
    });
  });

  describe("getClientOrders", function () {
    it("Should return user orders correctly", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const offerId = await vendorCreateOffer();
      const orderId1 = await clientCreateOrder(offerId);
      const orderId2 = await clientCreateOrder(offerId);

      const userOrders = await marketplace.getClientOrders(client.address);

      expect(userOrders).to.have.lengthOf(2);
      expect(userOrders.map((o: any) => o[0])).to.deep.equal([orderId1, orderId2]);
    });

    it("Should return an empty array for users with no orders", async function () {
      const { marketplace, other } = await loadFixture(
        deployMarketplaceFixture
      );
      const userOrders = await marketplace.getClientOrders(other.address);
      expect(userOrders).to.deep.equal([]);
    });

    it("Should return an empty array for vendors who have not placed orders as clients", async function () {
      const { marketplace, vendor, vendorCreateOffer } = await loadFixture(
        deployMarketplaceFixture
      );
      await vendorCreateOffer();

      const vendorOrders = await marketplace.getClientOrders(vendor.address);
      expect(vendorOrders).to.deep.equal([]);
    });
  });

  describe("getVendorOrders", function () {
    it("Should return an empty array for vendors with no orders", async function () {
      const { marketplace, other } = await loadFixture(
        deployMarketplaceFixture
      );
      const vendorOrders = await marketplace.getVendorOrders(other.address);
      expect(vendorOrders).to.deep.equal([]);
    });

    it("Should return an empty array when querying a client address", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const offerId = await vendorCreateOffer();
      await clientCreateOrder(offerId);

      const clientOrders = await marketplace.getVendorOrders(client.address);

      expect(clientOrders).to.deep.equal([]);
    });
  });
});
