// Focused test: the tool time budget is configurable through the TOOL_TIMEOUT environment variable (config.js -> agent.js).
//
//   node test-tool-timeout-config.js                     (run in the project folder)
//   node test-tool-timeout-config.js "<project dir>"
//
// Safety: config.js / agent.js and their modules are COPIED into fresh temporary folders. The real .env is never read
// (`dotenv` is a stub that does nothing) and nothing from it is printed; `openai` is a stub (no network); tools are
// scripted fakes; the project's data/ is never touched (checked at the end). process.env is restored afterwards.
"use strict";
const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");
const cp = require("child_process");
const assert = require("node:assert/strict");

const projectDir = path.resolve(process.argv[2] || __dirname);
const FILES = [
  "agent.js",
  "config.js",
  "toolValidator.js",
  "tools.js",
  "experienceStore.js",
  "experienceRetriever.js",
  "skillEngine.js",
];
for (const f of FILES)
  if (!fs.existsSync(path.join(projectDir, f))) {
    console.error(`missing ${f} in ${projectDir}`);
    process.exit(2);
  }

const savedEnv = {
  TOOL_TIMEOUT: process.env.TOOL_TIMEOUT,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
  OLLAMA_MODEL: process.env.OLLAMA_MODEL,
};
const restoreEnv = () => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
};
const clean = () => {
  delete process.env.TOOL_TIMEOUT;
  delete process.env.OLLAMA_BASE_URL;
  delete process.env.OLLAMA_MODEL;
  process.env.OPENROUTER_API_KEY = "dummy-not-used";
};

// ---------- stubs ----------
let script = [];
class FakeOpenAI {
  constructor() {
    this.chat = {
      completions: {
        create: async (p) => {
          const n = script.shift();
          if (!n) throw new Error("scripted model: no more responses");
          return n(p);
        },
      },
    };
  }
}
const nativeCall = (name, args) => () => ({
  choices: [
    {
      message: {
        content: null,
        tool_calls: [
          {
            type: "function",
            function: { name, arguments: JSON.stringify(args) },
          },
        ],
      },
      finish_reason: "tool_calls",
    },
  ],
  usage: {},
});
const origLoad = Module._load;
Module._load = function (request) {
  if (request === "openai") return FakeOpenAI;
  if (request === "dotenv") return { config() {} };
  return origLoad.apply(this, arguments);
};
const spawned = [];
cp.execFile = (...a) => {
  spawned.push(a[0]);
  const cb = a.find((x) => typeof x === "function");
  if (cb) cb(null, "", "");
  return { unref() {} };
};
cp.spawn = (...a) => {
  spawned.push(a[0]);
  return { unref() {}, on() {}, once() {} };
};

const created = [];
const realSetTimeout = global.setTimeout;
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms));
function copyProject(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `9j-cfg-${label}-`));
  created.push(dir);
  for (const f of FILES)
    fs.copyFileSync(path.join(projectDir, f), path.join(dir, f));
  for (const k of Object.keys(require.cache))
    if (k.startsWith(dir)) delete require.cache[k];
  return dir;
}
// load config.js fresh with TOOL_TIMEOUT = value (undefined = unset); returns { config, warnings }
function loadConfig(value, label = "cfg") {
  clean();
  if (value !== undefined) process.env.TOOL_TIMEOUT = value;
  const dir = copyProject(label);
  const warnings = [];
  const ow = console.warn;
  console.warn = (...a) => warnings.push(a.join(" "));
  try {
    return { config: require(path.join(dir, "config.js")), warnings };
  } finally {
    console.warn = ow;
  }
}
// load agent.js fresh with TOOL_TIMEOUT = value and a scripted tool; records the delay requested by the tool timer
async function runStalledTool(
  value,
  { tool = () => new Promise(() => {}), shortenTo = null } = {},
) {
  clean();
  if (value !== undefined) process.env.TOOL_TIMEOUT = value;
  const dir = copyProject("agent");
  const warnings = [];
  const ow = console.warn;
  console.warn = (...a) => warnings.push(a.join(" "));
  const requested = [];
  global.setTimeout = function (fn, ms, ...rest) {
    if (typeof ms === "number" && ms >= 100 && ms !== 2500) {
      requested.push(ms);
      if (shortenTo) ms = shortenTo;
    }
    return realSetTimeout(fn, ms, ...rest);
  };
  try {
    const tl = require(path.join(dir, "tools.js"));
    tl.executeTool = async () => tool();
    const agent = require(path.join(dir, "agent.js"));
    script = [nativeCall("calculator", { expression: "1+1" })];
    const log = console.log,
      err = console.error;
    console.log = () => {};
    console.error = () => {};
    let r;
    try {
      r = await Promise.race([
        agent.runAgent("حساب کن"),
        sleep(2500).then(() => "__HANG__"),
      ]);
    } finally {
      console.log = log;
      console.error = err;
    }
    return { result: r, requested, warnings };
  } finally {
    global.setTimeout = realSetTimeout;
    console.warn = ow;
  }
}

let passed = 0,
  failed = 0;
const t = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS  ${name}`);
    passed++;
  } catch (e) {
    console.log(
      `FAIL  ${name}\n      ${String(e.message).split("\n").join("\n      ")}`,
    );
    failed++;
  }
};

(async () => {
  const realData = path.join(projectDir, "data", "experiences.jsonl");
  const realBefore = fs.existsSync(realData) ? fs.statSync(realData) : null;
  console.log(`project: ${projectDir}\n`);

  // ---------------- config.js ----------------
  await t("default: TOOL_TIMEOUT unset -> 60000, no warning", () => {
    const { config, warnings } = loadConfig(undefined);
    assert.equal(config.toolTimeout, 60000);
    assert.deepEqual(warnings, []);
  });
  for (const [input, expected] of [
    ["90000", 90000],
    ["1500", 1500],
    ["1", 1],
    ["60000", 60000],
    ["  120000  ", 120000],
    ["007", 7],
    ["2147483647", 2147483647],
  ]) {
    await t(
      `custom: TOOL_TIMEOUT=${JSON.stringify(input)} -> ${expected}, no warning`,
      () => {
        const { config, warnings } = loadConfig(input);
        assert.equal(config.toolTimeout, expected);
        assert.deepEqual(warnings, []);
      },
    );
  }
  const invalid = [
    "0",
    "00",
    "-1",
    "-60000",
    "",
    "   ",
    "abc",
    "60s",
    "60000ms",
    "1.5",
    "1e3",
    "0x10",
    "NaN",
    "Infinity",
    "-Infinity",
    "+5",
    "5 5",
    "٦٠٠٠٠",
    "2147483648",
    "99999999999999999999999",
    "null",
    "undefined",
  ];
  for (const input of invalid) {
    await t(
      `invalid: TOOL_TIMEOUT=${JSON.stringify(input)} -> default 60000 and ONE warning`,
      () => {
        const { config, warnings } = loadConfig(input);
        assert.equal(config.toolTimeout, 60000);
        assert.equal(warnings.length, 1);
        assert.match(
          warnings[0],
          /TOOL_TIMEOUT is invalid and was ignored\. Using the default \(60000 ms\)\./,
        );
      },
    );
  }
  await t(
    "the warning never contains the API key or the rejected value",
    () => {
      clean();
      process.env.OPENROUTER_API_KEY = "sk-or-v1-SECRETSECRETSECRET1234";
      process.env.TOOL_TIMEOUT = "weird-value-xyz";
      const dir = copyProject("secret");
      const w = [];
      const ow = console.warn;
      console.warn = (...a) => w.push(a.join(" "));
      try {
        require(path.join(dir, "config.js"));
      } finally {
        console.warn = ow;
      }
      assert.equal(w.length, 1);
      assert.ok(
        !w[0].includes("SECRETSECRET") && !w[0].includes("weird-value-xyz"),
      );
    },
  );
  await t(
    "the resulting value is always a safe integer in 1..2147483647 (every probed input)",
    () => {
      for (const input of [undefined, ...invalid, "5", "999999999"]) {
        const v = loadConfig(input).config.toolTimeout;
        assert.ok(
          Number.isSafeInteger(v) && v >= 1 && v <= 2147483647,
          `${input} -> ${v}`,
        );
      }
    },
  );
  await t(
    "existing config keys/values unchanged (openRouterApiKey, ollamaBaseURL, ollamaModel) + new toolTimeout",
    () => {
      const { config } = loadConfig(undefined);
      assert.deepEqual(Object.keys(config), [
        "openRouterApiKey",
        "ollamaBaseURL",
        "ollamaModel",
        "toolTimeout",
      ]);
      assert.equal(config.openRouterApiKey, "dummy-not-used");
      assert.equal(config.ollamaBaseURL, "http://localhost:11434/v1");
      assert.equal(config.ollamaModel, "qwen3:4b-instruct");
      clean();
      process.env.OLLAMA_BASE_URL = "http://example.invalid/v1";
      process.env.OLLAMA_MODEL = "m1";
      process.env.TOOL_TIMEOUT = "5000";
      const c2 = require(path.join(copyProject("env2"), "config.js"));
      assert.equal(c2.ollamaBaseURL, "http://example.invalid/v1");
      assert.equal(c2.ollamaModel, "m1");
      assert.equal(c2.toolTimeout, 5000);
    },
  );
  await t(
    "a missing OPENROUTER_API_KEY still throws the same error (unchanged)",
    () => {
      clean();
      delete process.env.OPENROUTER_API_KEY;
      const dir = copyProject("nokey");
      assert.throws(() => require(path.join(dir, "config.js")), {
        message: "OPENROUTER_API_KEY is missing from .env",
      });
    },
  );

  // ---------------- agent.js ----------------
  await t(
    "source: agent.js takes TOOL_TIMEOUT from config (no hard-coded 60000 left)",
    () => {
      const src = fs.readFileSync(path.join(projectDir, "agent.js"), "utf8");
      assert.equal(
        (src.match(/const TOOL_TIMEOUT = config\.toolTimeout;/g) || []).length,
        1,
      );
      assert.ok(!/TOOL_TIMEOUT = 60000/.test(src));
    },
  );
  await t(
    "agent default: tool timer is created with 60000 ms and the message is unchanged ('timed out after 60s')",
    async () => {
      const { result, requested } = await runStalledTool(undefined, {
        shortenTo: 150,
      });
      assert.ok(requested.includes(60000), `requested delays: ${requested}`);
      assert.equal(result.success, false);
      assert.equal(
        result.error,
        'Tool "calculator" timed out after 60s.',
      );
      assert.equal(
        result.history[0].result,
        'ERROR: Tool "calculator" timed out after 60s.',
      );
    },
  );
  await t(
    "agent custom: TOOL_TIMEOUT=300 -> the stalled tool times out after ~300 ms (real time, no shortening), message says 0.3s",
    async () => {
      const t0 = Date.now();
      const { result, requested } = await runStalledTool("300");
      assert.notEqual(result, "__HANG__");
      assert.ok(requested.includes(300));
      assert.equal(result.success, false);
      assert.equal(
        result.error,
        'Tool "calculator" timed out after 0.3s.',
      );
      const dt = Date.now() - t0;
      assert.ok(dt >= 280 && dt < 2000, `elapsed ${dt}ms`);
    },
  );
  await t(
    "agent custom: a larger budget lets a slower tool finish (TOOL_TIMEOUT=1000, tool takes 300 ms) -> success",
    async () => {
      const { result } = await runStalledTool("1000", {
        tool: () =>
          new Promise((r) =>
            realSetTimeout(() => r({ success: true, result: "done" }), 300),
          ),
      });
      assert.equal(result.history[0].success, true);
      assert.equal(result.history[0].result, "done");
      assert.ok(!/timed out/.test(JSON.stringify(result)));
    },
  );
  for (const input of ["0", "-5", "abc", "60s", "1e3", "", "2147483648"]) {
    await t(
      `agent invalid: TOOL_TIMEOUT=${JSON.stringify(input)} -> falls back to 60000 (timer 60000 ms, 'timed out after 60s')`,
      async () => {
        const { result, requested, warnings } = await runStalledTool(input, {
          shortenTo: 150,
        });
        assert.ok(requested.includes(60000), `requested: ${requested}`);
        assert.match(result.error, /timed out after 60s\./);
        assert.equal(warnings.length, 1);
      },
    );
  }
  await t(
    "agent: ordinary tool results are unaffected by a custom budget",
    async () => {
      const { result } = await runStalledTool("5000", {
        tool: async () => ({ success: false, error: "Invalid calculation" }),
      });
      assert.equal(result.success, false);
      assert.equal(result.error, "Invalid calculation");
      assert.ok(!/timed out/.test(JSON.stringify(result)));
    },
  );

  await t("no process was spawned by this test", () =>
    assert.deepEqual(spawned, []),
  );
  await t("the project's real data/experiences.jsonl was not touched", () => {
    const after = fs.existsSync(realData) ? fs.statSync(realData) : null;
    assert.equal(!!after, !!realBefore);
    if (after) {
      assert.equal(after.size, realBefore.size);
      assert.equal(after.mtimeMs, realBefore.mtimeMs);
    }
  });
  await t("process.env is restored after the test", () => {
    restoreEnv();
    for (const [k, v] of Object.entries(savedEnv))
      assert.equal(process.env[k], v);
  });

  restoreEnv();
  global.setTimeout = realSetTimeout;
  for (const d of created) fs.rmSync(d, { recursive: true, force: true });
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
