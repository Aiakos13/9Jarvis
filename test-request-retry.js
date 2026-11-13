const assert = require("node:assert/strict");
const {
  isRetryableRequestError,
  getRetryDelay,
  retryRequest,
} = require("./requestRetry");

async function main() {
  assert.equal(isRetryableRequestError({ status: 503 }), true);
  assert.equal(isRetryableRequestError({ status: 429 }), true);
  assert.equal(isRetryableRequestError({ status: 401 }), false);
  assert.equal(isRetryableRequestError({ status: 400 }), false);
  assert.equal(isRetryableRequestError({ code: "ECONNRESET" }), true);
  assert.equal(isRetryableRequestError({ code: "ETIMEDOUT" }), true);
  assert.equal(isRetryableRequestError({ cause: { code: "ECONNRESET" } }), true);

  assert.equal(getRetryDelay(1), 500);
  assert.equal(getRetryDelay(2), 1000);
  assert.equal(getRetryDelay(10), 5000);

  let attempts = 0;
  let sleeps = 0;

  const result = await retryRequest(async () => {
    attempts++;
    if (attempts === 1) {
      throw Object.assign(new Error("Temporary failure"), { status: 503 });
    }
    return "success";
  }, {
    sleep: async () => { sleeps++; },
  });

  assert.equal(result, "success");
  assert.equal(attempts, 2);
  assert.equal(sleeps, 1);

  attempts = 0;

  await assert.rejects(
    retryRequest(async () => {
      attempts++;
      throw Object.assign(new Error("Unauthorized"), { status: 401 });
    }, {
      sleep: async () => { throw new Error("Unexpected sleep"); },
    }),
    /Unauthorized/,
  );

  assert.equal(attempts, 1);

  console.log("Retry tests: 15 assertions passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
