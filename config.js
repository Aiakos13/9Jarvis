require("dotenv").config({ override: true });

const DEFAULT_TOOL_TIMEOUT = 60000;
const MAX_TOOL_TIMEOUT = 2147483647; // setTimeout limit: larger values fire after 1 ms

// TOOL_TIMEOUT (milliseconds): only a plain positive integer up to MAX_TOOL_TIMEOUT is accepted.
// Anything else (empty, 0, negative, decimal, text, units like "60s", too large) falls back to the default.
function parseToolTimeout(value) {
  if (value === undefined) {
    return DEFAULT_TOOL_TIMEOUT;
  }

  const text = String(value).trim();

  if (/^\d+$/.test(text)) {
    const milliseconds = Number(text);

    if (milliseconds > 0 && milliseconds <= MAX_TOOL_TIMEOUT) {
      return milliseconds;
    }
  }

  console.warn(
    `TOOL_TIMEOUT is invalid and was ignored. Using the default (${DEFAULT_TOOL_TIMEOUT} ms).`,
  );

  return DEFAULT_TOOL_TIMEOUT;
}


const MAX_REQUEST_TIMEOUT = 2147483647;

function parsePositiveInteger(value, fallback, maximum, name) {
  if (value === undefined) return fallback;

  const text = String(value).trim();

  if (/^\d+$/.test(text)) {
    const parsed = Number(text);
    if (Number.isSafeInteger(parsed) && parsed > 0 && parsed <= maximum) {
      return parsed;
    }
  }

  console.warn(
    `${name} is invalid and was ignored. Using the default (${fallback}).`,
  );

  return fallback;
}

const config = {
  openRouterApiKey: process.env.OPENROUTER_API_KEY,

  ollamaBaseURL:
    process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",

  ollamaModel:
    process.env.OLLAMA_MODEL || "qwen3:4b-instruct",

  toolTimeout: parseToolTimeout(process.env.TOOL_TIMEOUT),

  agentRequestTimeout: parsePositiveInteger(
    process.env.AGENT_REQUEST_TIMEOUT,
    120000,
    MAX_REQUEST_TIMEOUT,
    "AGENT_REQUEST_TIMEOUT",
  ),

  visionRequestTimeout: parsePositiveInteger(
    process.env.VISION_REQUEST_TIMEOUT,
    120000,
    MAX_REQUEST_TIMEOUT,
    "VISION_REQUEST_TIMEOUT",
  ),

  agentMaxAttempts: parsePositiveInteger(
    process.env.AGENT_MAX_ATTEMPTS,
    2,
    5,
    "AGENT_MAX_ATTEMPTS",
  ),

  visionMaxAttempts: parsePositiveInteger(
    process.env.VISION_MAX_ATTEMPTS,
    2,
    5,
    "VISION_MAX_ATTEMPTS",
  ),
};

if (!config.openRouterApiKey) {
  throw new Error("OPENROUTER_API_KEY is missing from .env");
}

module.exports = config;
