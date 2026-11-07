require("dotenv").config({ override: true });

const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,

  ollamaBaseURL:
    process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",

  ollamaModel:
    process.env.OLLAMA_MODEL || "qwen3:4b-fast",
};

if (!config.openRouterApiKey) {
  throw new Error("OPENROUTER_API_KEY is missing from .env");
}

module.exports = config;