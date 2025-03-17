/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IS_TESTNET: string;
  readonly VITE_MARKETPLACE_ADDRESS: string;
  readonly VITE_ERC20_TOKEN_ADDRESS: string;
  readonly VITE_MARKETPLACE_CHAIN_ID: string;
  readonly VITE_MARKETPLACE_SEQUENCER_OFFERS: string;
  readonly MARKETPLACE_REPLICA_OFFERS: string;
  readonly VITE_PROVIDER_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
