import { z } from "zod";

// NOTE: DO NOT destructure process.env
const env = {
  IS_TESTNET: import.meta.env.VITE_IS_TESTNET,
  MARKETPLACE_ADDRESS: import.meta.env.VITE_MARKETPLACE_ADDRESS,
  ERC20_TOKEN_ADDRESS: import.meta.env.VITE_ERC20_TOKEN_ADDRESS,
  MARKETPLACE_CHAIN_ID: import.meta.env.VITE_MARKETPLACE_CHAIN_ID,
  PROVIDER_NAME: import.meta.env.VITE_PROVIDER_NAME
};

const envSchema = z
  .object({
    IS_TESTNET: z.string().transform((value) => value.toLowerCase() === "true"),
    MARKETPLACE_ADDRESS: z.string(),
    MARKETPLACE_CHAIN_ID: z.string(),
    ERC20_TOKEN_ADDRESS: z.string(),
    PROVIDER_NAME: z.string(),
  })
  .required();

const envParsed = () => envSchema.parse(env);

export default envParsed;
