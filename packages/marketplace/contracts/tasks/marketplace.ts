import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment, TaskArguments } from "hardhat/types";
import { z } from "zod";

export const OfferMetadataSchema = z.object({
  title: z.string(),
  features: z.array(z.string()),
  wallets: z
    .object({
      sequencer: z.string(),
      batcher: z.string(),
      challenger: z.string(),
      proposer: z.string(),
    })
    .optional(), // replica offers don't include this
});

export const OrderMetadataSchema = z.object({
  name: z.string(),
  artifacts: z.string().optional(),
  sequencerUrl: z.string().optional(),
});

export const FulfillOrderMetadataSchema = z.object({
  artifacts: z.string(),
  urls: z.object({
    rpc: z.string(),
    explorer: z.string(),
    monitoring: z.string(),
  }),
  network: z.object({
    l1ChainID: z.number(),
    l2ChainID: z.number(),
  }),
  addresses: z.record(z.string(), z.string()),
});

task("create-offer", "Create a new offer")
  .addParam("price", "Price per month in tokens")
  .addParam("metadata", "Offer metadata")
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      // validate params
      const price = z.number().gt(0).parse(taskArguments.price);
      const metadata = OfferMetadataSchema.parse(
        JSON.parse(taskArguments.metadata)
      );

      // recover deployment
      const chain = await hre.ethers.provider.getNetwork();
      const deployed_addresses = require(
        `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
      );
      const marketplaceAddress =
        deployed_addresses["MarketplaceModule#Marketplace"];
      const marketplace = await hre.ethers.getContractAt(
        "Marketplace",
        marketplaceAddress
      );
      const tokenAddress = await marketplace.paymentToken();
      const token = await hre.ethers.getContractAt("TestToken", tokenAddress);
      const tokenDecimals = await token.decimals();

      console.log("Creating offer");
      const tx = await marketplace.createOffer(
        BigInt(price) * 10n ** BigInt(tokenDecimals),
        hre.ethers.MaxUint256,
        JSON.stringify(metadata)
      );
      const receipt = await tx.wait();

      const offerId = (receipt?.logs[0] as any).args[1];
      console.log(`Offer created with OfferId: ${offerId}`);
    }
  );

task("create-order", "Create a new order")
  .addParam("offerId", "Offer ID for which to create order")
  .addParam("initialCommitment", "Initial commitment for order")
  .addParam("metadata", "Request metadata")
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      // validate params
      const offerId = z.number().gt(0).parse(taskArguments.offerId);
      const initialCommitment = z
        .number()
        .gt(0)
        .parse(taskArguments.initialCommitment);
      const metadata = OrderMetadataSchema.parse(
        JSON.parse(taskArguments.metadata)
      );

      // recover deployment
      const chain = await hre.ethers.provider.getNetwork();
      const deployed_addresses = require(
        `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
      );
      const marketplaceAddress =
        deployed_addresses["MarketplaceModule#Marketplace"];
      const marketplace = await hre.ethers.getContractAt(
        "Marketplace",
        marketplaceAddress
      );
      const paymentToken = await marketplace.paymentToken();
      const token = await hre.ethers.getContractAt("TestToken", paymentToken);

      // approve
      console.log("Approving tokens");
      const approveTx = await token.approve(
        marketplaceAddress,
        hre.ethers.MaxUint256
      );
      await approveTx.wait();
      console.log("Approved with tx: ", approveTx.hash);

      // create order
      console.log("Creating order");
      const createOrderTx = await marketplace.createOrder(
        offerId,
        initialCommitment,
        JSON.stringify(metadata)
      );
      const receipt = await createOrderTx.wait();
      console.log("Order created with tx: ", createOrderTx.hash);

      // recover order id
      const event = receipt?.logs
        .map((log) => {
          try {
            return marketplace.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((event) => event?.name === "NewOrder");

      if (!event) {
        throw new Error("OrderCreated event not found in transaction receipt");
      }

      const orderId = event.args.orderId;
      console.log(`Order Id: ${orderId}`);
    }
  );

task("fulfill-order", "Fills an order")
  .addParam("orderId", "Offer ID for which to create order")
  .addParam("metadata", "Chain artifacts if existing chain", "")
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      // validate params
      const orderId = z.number().gt(0).parse(taskArguments.orderId);
      const metadata = FulfillOrderMetadataSchema.parse(
        JSON.parse(taskArguments.metadata)
      );

      // recover deployment
      const chain = await hre.ethers.provider.getNetwork();
      const deployed_addresses = require(
        `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
      );
      const marketplace = await hre.ethers.getContractAt(
        "Marketplace",
        deployed_addresses["MarketplaceModule#Marketplace"]
      );

      // fulfill order
      console.log("Fulfilling order...");
      const tx = await marketplace.fulfillOrder(
        orderId,
        JSON.stringify(metadata)
      );
      await tx.wait();

      console.log(`Fulfilled order ${orderId} in tx ${tx.hash}`);
    }
  );

task("withdraw", "Withdraws from order")
  .addParam("orderId", "Offer ID for which to create order")
  .addParam("amount", "Tokens to withdraw")
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      // validate params
      const orderId = z.number().gt(0).parse(taskArguments.orderId);
      const amount = z.number().gt(0).parse(taskArguments.amount);

      // recover deployment
      const chain = await hre.ethers.provider.getNetwork();
      const deployed_addresses = require(
        `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
      );
      const marketplace = await hre.ethers.getContractAt(
        "Marketplace",
        deployed_addresses["MarketplaceModule#Marketplace"]
      );
      const paymentToken = await marketplace.paymentToken();
      const token = await hre.ethers.getContractAt("TestToken", paymentToken);
      const decimals = await token.decimals();

      // withdraw from order
      console.log("Withdrawing from order...");
      const tx = await marketplace.withdraw(
        orderId,
        BigInt(amount) * 10n ** BigInt(decimals)
      );
      await tx.wait();

      console.log(`Withdraw from ${orderId} in tx ${tx.hash}`);
    }
  );

task("balance", "Balance of actor in a order")
  .addParam("of", "Address")
  .addParam("orderId", "OrderId")
  .setAction(
    async (taskArguments: TaskArguments, hre: HardhatRuntimeEnvironment) => {
      // validate params
      const of = z.string().parse(taskArguments.of);
      const orderId = z.number().gte(0).parse(taskArguments.orderId);

      // recover deployment
      const chain = await hre.ethers.provider.getNetwork();
      const deployed_addresses = require(
        `../ignition/deployments/chain-${chain.chainId}/deployed_addresses.json`
      );
      const marketplace = await hre.ethers.getContractAt(
        "Marketplace",
        deployed_addresses["MarketplaceModule#Marketplace"]
      );

      // balance
      const balance = await marketplace.balanceOf(of, orderId);

      console.log(`Balance: ${balance}`);
    }
  );
