import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

// test constants
const PRICE_PER_HOUR = 100n;
const DEPLOYMENT_FEE = 10n;
const FULFILLMENT_TIME = 100n;
const UNITS = 100n;
const INITIAL_AMOUNT = 200n;

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
        .createOffer(PRICE_PER_HOUR, DEPLOYMENT_FEE, FULFILLMENT_TIME, UNITS);

      return (await marketplace.offerCount()) - 1n;
    }

    async function clientCreateOrder(offerId: bigint) {
      await marketplace.connect(client).createOrder(offerId, INITIAL_AMOUNT);

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

  describe("Initialize", function () {
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
          .createOffer(PRICE_PER_HOUR, DEPLOYMENT_FEE, FULFILLMENT_TIME, UNITS)
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
          .createOffer(PRICE_PER_HOUR, DEPLOYMENT_FEE, FULFILLMENT_TIME, UNITS)
      )
        .to.emit(marketplace, "NewOffer")
        .withArgs(
          vendor.address,
          0n,
          PRICE_PER_HOUR,
          DEPLOYMENT_FEE,
          FULFILLMENT_TIME,
          UNITS
        );
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
    it("Should transfer to contract initial amount", async function () {
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
        marketplace.connect(client).createOrder(offerId, INITIAL_AMOUNT)
      ).not.to.be.reverted;
      expect((await marketplace.orders(0n)).balance).to.equal(INITIAL_AMOUNT);
      expect((await marketplace.offers(offerId)).remainingUnits).to.equal(
        UNITS - 1n
      );
      expect(await token.balanceOf(marketplaceAddress)).to.equal(
        INITIAL_AMOUNT
      );
    });

    it("Should revert if not enough for deployment fee", async function () {
      const { marketplace, client, vendorCreateOffer } = await loadFixture(
        deployMarketplaceFixture
      );
      const offerId = await vendorCreateOffer();

      // act and assert
      await expect(
        marketplace.connect(client).createOrder(offerId, DEPLOYMENT_FEE - 1n)
      ).to.be.reverted;
    });

    it("Should emit NewOrder event", async function () {
      const { marketplace, client, vendor, vendorCreateOffer } =
        await loadFixture(deployMarketplaceFixture);
      const offerId = await vendorCreateOffer();

      // act and assert
      await expect(
        marketplace.connect(client).createOrder(offerId, INITIAL_AMOUNT)
      )
        .to.emit(marketplace, "NewOrder")
        .withArgs(vendor.address, client.address, offerId);
    });
  });

  describe("FulfillOrder", function () {
    it("Should transfer to vendor deployment fee", async function () {
      const {
        marketplace,
        vendor,
        token,
        vendorCreateOffer,
        clientCreateOrder,
      } = await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      await expect(
        marketplace.connect(vendor).fulfillOrder(orderId, "metadata")
      ).not.to.be.reverted;
      expect(await token.balanceOf(vendor.address)).to.equal(DEPLOYMENT_FEE);
      expect((await marketplace.orders(orderId)).balance).to.equal(
        INITIAL_AMOUNT - DEPLOYMENT_FEE
      );
    });

    it("Should update fulfilledAt and lastWithdrawal", async function () {
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
      expect((await marketplace.orders(orderId)).lastWithdrawal).to.equal(
        block?.timestamp
      );
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
    it("Should revert if order not fulfilled and within fulfillment time", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      await expect(marketplace.connect(client).terminateOrder(orderId)).to.be
        .reverted;
    });

    it("Should transfer out the remaining balance", async function () {
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
      const vendorBalanceBefore = await token.balanceOf(vendor.address);

      // travel forward in time one hour to get exactly one payment in
      await time.increaseTo(
        (await marketplace.orders(orderId)).fulfilledAt! + 1n
      );

      // act
      await marketplace.connect(client).terminateOrder(orderId);

      const clientBalanceAfter = await token.balanceOf(client.address);
      const vendorBalanceAfter = await token.balanceOf(vendor.address);

      // assert
      expect(vendorBalanceAfter).to.equal(vendorBalanceBefore + PRICE_PER_HOUR);
      expect(clientBalanceAfter).to.equal(
        clientBalanceBefore + orderBalanceBefore - PRICE_PER_HOUR
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
      await expect(marketplace.connect(client).withdraw(orderId, 10n)).to.be
        .reverted;
    });

    it("Should revert if not fulfilled and within fulfillment time", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } =
        await loadFixture(deployMarketplaceFixture);
      const orderId = await clientCreateOrder(await vendorCreateOffer());

      // act and assert
      await expect(marketplace.connect(client).withdraw(orderId, 10n)).to.be
        .reverted;
    });

    it("Should transfer balance to caller", async function () {
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
      const orderBalanceBefore = (await marketplace.orders(orderId)).balance;

      // act
      await marketplace.connect(client).withdraw(orderId, 10n);

      const clientBalanceAfter = await token.balanceOf(client.address);
      const orderBalanceAfter = (await marketplace.orders(orderId)).balance;

      // assert
      expect(clientBalanceAfter).to.equal(clientBalanceBefore + 10n);
      expect(orderBalanceAfter).to.equal(orderBalanceBefore - 10n);
    });

    it("Should emit Withdraw event", async function () {
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
      await expect(marketplace.connect(client).withdraw(orderId, 10n))
        .to.emit(marketplace, "Withdrawal")
        .withArgs(client.address, orderId, 10n);
    });

    it("Should NOT update lastWithdrawal if client is withdrawing", async function () {
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
      const tx = await marketplace.connect(client).withdraw(orderId, 10n);
      const timestamp = (await tx.getBlock())?.timestamp;

      await expect(
        (await marketplace.orders(orderId)).lastWithdrawal
      ).not.to.equal(timestamp);
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
      ).to.equal(INITIAL_AMOUNT);
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
      ).to.equal(INITIAL_AMOUNT);
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
      ).to.equal(INITIAL_AMOUNT - PRICE_PER_HOUR - DEPLOYMENT_FEE);
      expect(
        await marketplace.balanceOf(await vendor.getAddress(), orderId)
      ).to.equal(PRICE_PER_HOUR); // deployment fee already withdrawn on fulfillment
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
      ).to.equal(INITIAL_AMOUNT - DEPLOYMENT_FEE); // deployment fee already withdrawn on fulfillment
    });
  });


  describe("getUserOrders", function () {
    it("Should return user orders correctly", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } = await loadFixture(deployMarketplaceFixture);
      const offerId = await vendorCreateOffer();
      const orderId1 = await clientCreateOrder(offerId);
      const orderId2 = await clientCreateOrder(offerId);
      
      const userOrders = await marketplace.getClientOrders(client.address);
      
      expect(userOrders).to.deep.equal([orderId1, orderId2]);
    });
  
    it("Should return an empty array for users with no orders", async function () {
      const { marketplace, other } = await loadFixture(deployMarketplaceFixture);
      const userOrders = await marketplace.getClientOrders(other.address);
      expect(userOrders).to.deep.equal([]);
    });
  
    it("Should return an empty array for vendors who have not placed orders as clients", async function () {
      const { marketplace, vendor, vendorCreateOffer } = await loadFixture(deployMarketplaceFixture);
      await vendorCreateOffer();
      
      const vendorOrders = await marketplace.getClientOrders(vendor.address);
      expect(vendorOrders).to.deep.equal([]);
    });
  });
  
  
  describe("getVendorOrders", function () {
    it("Should return vendor orders correctly", async function () {
      const { marketplace, vendor, vendorCreateOffer, clientCreateOrder } = await loadFixture(deployMarketplaceFixture);
      const offerId = await vendorCreateOffer();
      const orderId1 = await clientCreateOrder(offerId);
      const orderId2 = await clientCreateOrder(offerId);
  
      const vendorOrders = await marketplace.getVendorOrders(vendor.address);
  
      expect(vendorOrders).to.deep.equal([orderId1, orderId2]);
    });
  
    it("Should return an empty array for vendors with no orders", async function () {
      const { marketplace, other } = await loadFixture(deployMarketplaceFixture);
      const vendorOrders = await marketplace.getVendorOrders(other.address);
      expect(vendorOrders).to.deep.equal([]);
    });
  
    it("Should return an empty array when querying a client address", async function () {
      const { marketplace, client, vendorCreateOffer, clientCreateOrder } = await loadFixture(deployMarketplaceFixture);
      const offerId = await vendorCreateOffer();
      await clientCreateOrder(offerId);
  
      const clientOrders = await marketplace.getVendorOrders(client.address);
  
      expect(clientOrders).to.deep.equal([]);
    });
  });

});
