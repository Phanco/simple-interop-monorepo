import * as dotenv from "dotenv";
dotenv.config();

const env = process.env;
export default {
  LOGGER_LEVEL: env.LOGGER_LEVEL ?? "debug",

  DB_HOST: env.DB_HOST ?? "127.0.0.1",
  DB_PORT: env.DB_PORT ? +env.DB_PORT : 5432,
  DB_USERNAME: env.DB_USERNAME ?? "simple-interop",
  DB_PASSWORD: env.DB_PASSWORD ?? "let-me-in",
  DB_DATABASE: env.DB_DATABASE ?? "simple-interop",
  DB_LOGGING: env.DB_LOGGING === "true",

  SENDER_CHAIN_ID: +env.SENDER_CHAIN_ID || 31337,
  RECEIVER_CHAIN_ID: +env.RECEIVER_CHAIN_ID || 31338,

  NAME: env.NAME || "",
  PRIVATE_KEY: env.PRIVATE_KEY || "",
};
