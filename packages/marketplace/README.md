## Marketplace

Marketplace is a suite of contracts and a UI interface for creating and managing rollup deployments. Our contracts, deployed on Optimism, enable vendors to interact seamlessly with users while ensuring uptime and security guarantees.

Vendors can customize the UI with their branding and offers, directing users to manage their orders. Additionally, they can leverage the RUaaS toolkit to fulfill orders, deploy sequencers, and manage replicas via the console UI.

To simplify contract interactions, we provide Hardhat tasks in `packages/marketplace/contracts` and integration with the console.

### Contracts

You can find the latest deployment at `contracts/ignition/deployments/chain-{id}/deployed_addresses.json`. But here again for your convenience.

**Optimism Mainnet**

```json
{
  "MarketplaceModule#Marketplace": "0x7DA0F74025d49c0A060b0acAcA6B277da043ddF0"
}
```

Payment token is USDT: `0x94b008aA00579c1307B0EF2c499aD98a8ce58e58`

**Optimism Sepolia**

```json
{
  "TestToken#TestToken": "0x89771d5B1020549F8EC2815eACE52Aa5a0C84dEa",
  "MarketplaceModule#Marketplace": "0xe99b68EF5459f78cAbb7a352E60CD2D80801B687"
}
```

### UI

Vendors should take this repo and customize it to their needs. In particular before deployment they should:

1. Create as many offer as they wish. They can do so with the hardhat tasks:

```bash
npx hardhat create-offer --network <network> --price <price per month> --metadata <metadata>
```

2. Create a `.env` file based in `./packages/marketplace/ui` and fill in the variables accordingly.

```text
VITE_IS_TESTNET=true
VITE_MARKETPLACE_ADDRESS=0x59C70870ef0fEF59f71Ad57B2044e8Ebb49BA31D
VITE_ERC20_TOKEN_ADDRESS=0x071BCbC304B0E4eE088FFA46088a33A227c1410b
VITE_ERC20_TOKEN_SYMBOL="TEST"
VITE_MARKETPLACE_CHAIN_ID=11155420
VITE_PINATA_JWT=...
VITE_GATEWAY_URL=....mypinata.cloud
VITE_PROVIDER_NAME="Provider Name"
VITE_MARKETPLACE_SEQUENCER_OFFERS="0,1"
VITE_MARKETPLACE_REPLICA_OFFERS="2,3"
```

4. By default we include configuration for Optimism (mainnet, sepolia), Ethereum (mainnet, holesky) and Geth chains. If you plan on moving outside of there you should set them up in `ui/src/lib/hocs`.

5. Done! If you desire further customize the theme, logos, etc. You can test it all locally with `npm run dev` or deploy it with sst: `npx sst deploy`.
