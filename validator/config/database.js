// eslint-disable-next-line @typescript-eslint/no-require-imports
require("dotenv").config();

module.exports = {
  development: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || "simple-interop",
    password: process.env.DB_PASSWORD || "let-me-in",
    database: process.env.DB_DATABASE || "simple-interop",
    dialect: "postgres",
    logging: process.env.DB_LOGGING === "true" ? console.log : false,
  },
  production: {
    host: process.env.DB_HOST_PRODUCTION,
    port: process.env.DB_PORT_PRODUCTION,
    username: process.env.DB_USERNAME_PRODUCTION,
    password: process.env.DB_PASSWORD_PRODUCTION,
    database: process.env.DB_DATABASE_PRODUCTION,
    dialect: "postgres",
    logging: false,
  },
  test: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 5432,
    username: process.env.DB_USERNAME || "iou-gg-backend",
    password: process.env.DB_PASSWORD || "let-me-in",
    database: process.env.DB_DATABASE || "iou-gg-backend-test",
    dialect: "postgres",
    logging: false,
  }
};
