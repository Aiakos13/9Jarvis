require("dotenv").config();

const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
};

if (!config.openRouterApiKey) {
  throw new Error("OPENROUTER_API_KEY is missing from .env");
}

module.exports = config;