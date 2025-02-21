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

  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
