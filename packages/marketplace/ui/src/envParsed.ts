import { z } from "zod";

const env = {
  IS_TESTNET: import.meta.env.VITE_IS_TESTNET,
  MARKETPLACE_ADDRESS: import.meta.env.VITE_MARKETPLACE_ADDRESS,
  ERC20_TOKEN_ADDRESS: import.meta.env.VITE_ERC20_TOKEN_ADDRESS,
  ERC20_TOKEN_SYMBOL: import.meta.env.VITE_ERC20_TOKEN_SYMBOL,
  MARKETPLACE_CHAIN_ID: import.meta.env.VITE_MARKETPLACE_CHAIN_ID,
  MARKETPLACE_SEQUENCER_OFFERS: import.meta.env.VITE_MARKETPLACE_SEQUENCER_OFFERS,
  MARKETPLACE_REPLICA_OFFERS: import.meta.env.VITE_MARKETPLACE_REPLICA_OFFERS,
  PROVIDER_NAME: import.meta.env.VITE_PROVIDER_NAME
};

const envSchema = z
  .object({
    IS_TESTNET: z.string().transform((value) => value.toLowerCase() === "true"),
    MARKETPLACE_ADDRESS: z.string(),
    MARKETPLACE_CHAIN_ID: z.string(),
    ERC20_TOKEN_ADDRESS: z.string(),
    ERC20_TOKEN_SYMBOL: z.string(),
    MARKETPLACE_SEQUENCER_OFFERS: z.string(),
    MARKETPLACE_REPLICA_OFFERS: z.string(),
    PROVIDER_NAME: z.string(),
  })
  .required();

const envParsed = () => envSchema.parse(env);

export default envParsed;
