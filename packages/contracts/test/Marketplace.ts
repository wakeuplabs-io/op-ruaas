import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("Marketplace", function () {
  async function deployMarketplaceFixture() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Marketplace = await hre.ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy();
    const marketplaceAddress = await marketplace.getAddress();

    const Token = await hre.ethers.getContractFactory("TestToken");
    const token = await Token.deploy(1000000n);
    const tokenAddress = await token.getAddress();

    await marketplace.initialize(await token.getAddress());

    return {
      marketplace,
      marketplaceAddress,
      token,
      tokenAddress,
      owner,
      otherAccount,
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
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      await expect(marketplace.createOffer(1n, 2n, 3n)).not.to.be.reverted;
    });

    it("Should emit NewOffer event", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);

      const [pricePerHour, deploymentFee, units] = [1n, 2n, 3n];
      await expect(marketplace.createOffer(pricePerHour, deploymentFee, units))
        .to.emit(marketplace, "NewOffer")
        .withArgs(owner.address, 0n, pricePerHour, deploymentFee, units);
    });
  });

  describe("SetOfferRemainingUnits", function () {
    it("Should set remaining units", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);

      await marketplace.createOffer(1n, 2n, 3n);

      await expect(marketplace.setOfferRemainingUnits(0n, 10n)).not.to.be
        .reverted;
      expect((await marketplace.offers(0n)).remainingUnits).to.equal(10n);
    });
  });

  describe("Deposit", function () {
    it("Should deposit tokens", async function () {
      const { marketplace, marketplaceAddress, token, owner } =
        await loadFixture(deployMarketplaceFixture);

      await token.approve(marketplaceAddress, 10n);

      expect(await marketplace.deposit(10n)).not.to.be.reverted;
      expect(await token.balanceOf(marketplaceAddress)).to.equal(10n);
      expect(await marketplace.deposits(owner.address)).to.equal(10n);
    });

    it("Should emit deposit event", async function () {
      const { marketplace, marketplaceAddress, token, owner } =
        await loadFixture(deployMarketplaceFixture);

      await token.approve(marketplaceAddress, 10n);

      expect(await marketplace.deposit(10n))
        .to.emit(marketplace, "Deposit")
        .withArgs(owner.address, 10n);
    });
  });

  describe("Withdraw", function () {});

  describe("BalanceOf", function () {});
});
