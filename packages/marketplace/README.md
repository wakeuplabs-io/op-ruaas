# Marketplace

Marketplace is a set of contracts and ui interface that allows for the creation and management of rollup deployments. We have a set of contracts deployed in optimism that allow vendors to quickly interact with users while giving users some guarantees of uptime and security. We encourage vendors to customize with their brands and offers the ui and start forwarding users there to manage their orders. On top of that we encourage vendors to make full use of the ruaas toolkit to fulfill this orders, deploy sequencers, replicas and follow them with the console ui. To ease up marketplace contract interactions we also provide hardhat tasks in the `packages/marketplace/contracts` folder, you can read more there.

## Contracts

You can find the latest deployment at `contracts/ignition/deployments/chain-{id}/deployed_addresses.json`. But here again for your convenience.

Optimism Sepolia

```json
{
  "TestToken#TestToken": "0x89771d5B1020549F8EC2815eACE52Aa5a0C84dEa",
  "MarketplaceModule#Marketplace": "0xe99b68EF5459f78cAbb7a352E60CD2D80801B687"
}
```

## UI

Vendors should take this repo and customize it to their needs. In particular before deployment they should:

1. Create as many offer as they wish. They can do so with the hardhat tasks:

```bash
npx hardhat create-offer --network <network> --price <price per month> --metadata <metadata>
```

2. Create a `.env` file based in `./ui` and fill in the variables.

```bash
VITE_IS_TESTNET=true
VITE_MARKETPLACE_ADDRESS=0x59C70870ef0fEF59f71Ad57B2044e8Ebb49BA31D
VITE_ERC20_TOKEN_ADDRESS=0x071BCbC304B0E4eE088FFA46088a33A227c1410b
VITE_MARKETPLACE_CHAIN_ID=11155420
VITE_PINATA_JWT=...
VITE_GATEWAY_URL=....mypinata.cloud
VITE_PROVIDER_NAME="Provider Name"
VITE_MARKETPLACE_SEQUENCER_OFFERS="0,1"
VITE_MARKETPLACE_REPLICA_OFFERS="2,3"
```

3. Done! If you desire further customize the theme, logos, etc. You can test it all locally with `npm run dev` or deploy it with sst: `npx sst deploy`.
