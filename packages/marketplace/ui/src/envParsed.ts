import { z } from "zod";

// NOTE: DO NOT destructure process.env
const env = {
  IS_TESTNET: import.meta.env.VITE_IS_TESTNET,
};

const envSchema = z
  .object({
    IS_TESTNET: z.string().transform((value) => value.toLowerCase() === "true"),
  })
  .required();

const envParsed = () => envSchema.parse(env);

export default envParsed;
