## OP RaaS Console

The OP RaaS Console is a web application that provides a user interface for setting up and storing your Optimism Rollup-as-a-Service deployments. It also connects to the marketplace to manage customer orders.

To deploy the console, each vendor would need to:

1. Create a `.env` file based in `./ui` and fill in the variables accordingly.

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
