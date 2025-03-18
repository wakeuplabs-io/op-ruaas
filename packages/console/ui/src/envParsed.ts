import { z } from "zod";

const env = {
  APP_URL: import.meta.env.VITE_SERVER_URL,
  IS_TESTNET: import.meta.env.VITE_IS_TESTNET,
  MARKETPLACE_ADDRESS: import.meta.env.VITE_MARKETPLACE_ADDRESS,
  ERC20_TOKEN_ADDRESS: import.meta.env.VITE_ERC20_TOKEN_ADDRESS,
  MARKETPLACE_CHAIN_ID: import.meta.env.VITE_MARKETPLACE_CHAIN_ID,
  VITE_PINATA_JWT: import.meta.env.VITE_PINATA_JWT,
  VITE_GATEWAY_URL: import.meta.env.VITE_GATEWAY_URL,
};

const envSchema = z
  .object({
    APP_URL: z.string().url().optional().default("http://localhost:5000"),
    IS_TESTNET: z.string().transform((value) => value.toLowerCase() === "true"),
    MARKETPLACE_ADDRESS: z.string(),
    MARKETPLACE_CHAIN_ID: z.string(),
    ERC20_TOKEN_ADDRESS: z.string(),
    VITE_PINATA_JWT: z.string(),
    VITE_GATEWAY_URL: z.string(),
  })
  .required();

const envParsed = () => envSchema.parse(env);

export default envParsed;
