const RETRYABLE_STATUS_CODES = new Set([408, 409, 429]);
const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "EAI_AGAIN",
  "ENOTFOUND",
  "EPIPE",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
]);

function isRetryableRequestError(error) {
  if (!error || typeof error !== "object") return false;

  const status = Number(error.status ?? error.statusCode);

  if (Number.isInteger(status)) {
    return RETRYABLE_STATUS_CODES.has(status) || status >= 500;
  }

  const code = String(error.code || error.cause?.code || "").toUpperCase();

  if (RETRYABLE_NETWORK_CODES.has(code)) return true;

  if (
    error.name === "AbortError" ||
    error.name === "APIConnectionTimeoutError" ||
    error.name === "APIConnectionError"
  ) {
    return true;
  }

  return false;
}

function getRetryDelay(attempt, baseDelay = 500, maxDelay = 5000) {
  if (!Number.isInteger(attempt) || attempt < 1) {
    throw new RangeError("attempt must be a positive integer");
  }

  return Math.min(baseDelay * 2 ** (attempt - 1), maxDelay);
}

async function retryRequest(operation, options = {}) {
  const maxAttempts = options.maxAttempts ?? 2;
  const shouldRetry = options.shouldRetry ?? isRetryableRequestError;
  const delay = options.delay ?? getRetryDelay;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("maxAttempts must be a positive integer");
  }

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      const wait = delay(attempt);
      console.warn(
        `Request failed (attempt ${attempt}/${maxAttempts}). Retrying in ${wait}ms: ${error.message || error}`,
      );
      await sleep(wait);
    }
  }

  throw lastError;
}

module.exports = {
  isRetryableRequestError,
  getRetryDelay,
  retryRequest,
};
