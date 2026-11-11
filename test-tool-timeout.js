// Focused test: a tool that never settles must not hang the Agent (agent.js: executeToolWithTimeout).
//
//   node test-tool-timeout.js                     (run in the project folder)
//   node test-tool-timeout.js "<project dir>"
//
// Safety: agent.js and its modules are COPIED into fresh temporary folders; the project's data/ is never touched
// (checked at the end). `openai` and `dotenv` are stubs (no network, .env never read). Tools are replaced by
// scripted fakes, child_process.execFile/spawn are recorders, so nothing is opened, typed or executed.
// The real 60 s budget is shortened by wrapping setTimeout for that ONE delay value, so the test runs in ~2 s.
//
// If agent.js.before-tool-timeout.bak exists, the ORIGINAL agent is run too: it must HANG on the stalled tool
// (proving the weakness) and behave identically to the new agent for every ordinary outcome.
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
const BAK = path.join(projectDir, "agent.js.before-tool-timeout.bak");

const agentSrc = fs.readFileSync(path.join(projectDir, "agent.js"), "utf8");
let REAL_BUDGET = null; // the agent's budget comes from config.js (TOOL_TIMEOUT env var, default 60000); read once stubs are installed
const TEST_BUDGET = 150; // ms used instead of the real budget
process.env.OPENROUTER_API_KEY = "dummy-not-used";
delete process.env.TOOL_TIMEOUT; // test the default budget; .env is never read (dotenv is stubbed)

// ---------- stubs ----------
let script = [];
class FakeOpenAI {
  constructor() {
    this.chat = {
      completions: {
        create: async (p) => {
          const next = script.shift();
          if (!next) throw new Error("scripted model: no more responses");
          return next(p);
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
const finish = nativeCall("finish", {});
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

REAL_BUDGET = require(path.join(projectDir, "config.js")).toolTimeout;

// timer bookkeeping: shorten the real budget, remember which of these timers were cleared
const realSetTimeout = global.setTimeout,
  realClearTimeout = global.clearTimeout;
const budgetTimers = new Set(),
  clearedBudgetTimers = new Set();
global.setTimeout = function (fn, ms, ...rest) {
  if (REAL_BUDGET !== null && ms === REAL_BUDGET) {
    const h = realSetTimeout(fn, TEST_BUDGET, ...rest);
    budgetTimers.add(h);
    return h;
  }
  return realSetTimeout(fn, ms, ...rest);
};
global.clearTimeout = function (h) {
  if (budgetTimers.has(h)) clearedBudgetTimers.add(h);
  return realClearTimeout(h);
};
const resetTimers = () => {
  budgetTimers.clear();
  clearedBudgetTimers.clear();
};

const unhandled = [];
process.on("unhandledRejection", (e) => unhandled.push(e));

// ---------- helpers ----------
const created = [];
function sandbox(srcAgent, label, handlers) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `9j-tt-${label}-`));
  created.push(dir);
  for (const f of FILES)
    fs.copyFileSync(path.join(projectDir, f), path.join(dir, f));
  if (srcAgent) fs.copyFileSync(srcAgent, path.join(dir, "agent.js"));
  for (const k of Object.keys(require.cache))
    if (k.startsWith(dir)) delete require.cache[k];
  const tl = require(path.join(dir, "tools.js"));
  tl.executeTool = async (name, input) => handlers[name](input);
  const agent = require(path.join(dir, "agent.js"));
  return {
    dir,
    agent,
    records: () => {
      const f = path.join(dir, "data", "experiences.jsonl");
      return fs.existsSync(f)
        ? fs
            .readFileSync(f, "utf8")
            .split("\n")
            .filter(Boolean)
            .map((l) => JSON.parse(l))
        : [];
    },
  };
}
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms));
// quiet() silences the Agent's console output and withWatchdog() restores it, even when the run never settles
// (a hung run inside the silenced section must not leave console.log muted for the rest of the test).
const realLog = console.log,
  realErr = console.error;
function quiet(fn) {
  console.log = () => {};
  console.error = () => {};
  return fn();
}
async function withWatchdog(p, ms = 2500) {
  try {
    return await Promise.race([p, sleep(ms).then(() => "__HANG__")]);
  } finally {
    console.log = realLog;
    console.error = realErr;
  }
}
const never = () => new Promise(() => {});

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

  await t(
    "source: TOOL_TIMEOUT constant exists and executeToolWithTimeout is used in the loop (executeTool is not called directly there)",
    () => {
      assert.ok(
        REAL_BUDGET && REAL_BUDGET >= 1000,
        "TOOL_TIMEOUT missing or implausible",
      );
      assert.match(agentSrc, /const TOOL_TIMEOUT = (?:config\.toolTimeout|\d+);/);
      assert.equal(
        (
          agentSrc.match(
            /executeToolWithTimeout\(action\.tool, action\.input\)/g,
          ) || []
        ).length,
        1,
      );
      assert.equal((agentSrc.match(/await executeTool\(/g) || []).length, 0);
    },
  );
  await t(
    "module.exports unchanged: runAgent, parseAgentAction, normalizeNativeToolCall",
    () => {
      const s = sandbox(null, "exports", {});
      assert.deepEqual(Object.keys(s.agent), [
        "runAgent",
        "parseAgentAction",
        "normalizeNativeToolCall",
      ]);
    },
  );

  // 1. the weakness: a tool that never settles
  await t(
    "stalled tool -> runAgent RETURNS (does not hang) with success=false and a 'timed out' error",
    async () => {
      resetTimers();
      const s = sandbox(null, "stall", { calculator: never });
      script = [nativeCall("calculator", { expression: "1+1" })];
      const t0 = Date.now();
      const r = await withWatchdog(quiet(() => s.agent.runAgent("حساب کن")));
      assert.notEqual(r, "__HANG__", "runAgent hung");
      assert.equal(r.success, false);
      assert.match(r.error, /^Tool "calculator" timed out after \d+s\./);
      assert.ok(
        Date.now() - t0 >= TEST_BUDGET - 20 && Date.now() - t0 < 1500,
        `elapsed ${Date.now() - t0}ms`,
      );
    },
  );
  await t(
    "stalled tool -> the failed step is kept in history (tool, success=false, 'ERROR: ... timed out')",
    async () => {
      const s = sandbox(null, "stall-h", { calculator: never });
      script = [nativeCall("calculator", { expression: "1+1" })];
      const r = await withWatchdog(quiet(() => s.agent.runAgent("حساب کن")));
      assert.equal(r.history.length, 1);
      assert.equal(r.history[0].tool, "calculator");
      assert.equal(r.history[0].success, false);
      assert.match(r.history[0].result, /^ERROR: Tool "calculator" timed out/);
    },
  );
  await t(
    "stalled tool -> the run IS recorded as a failed experience with the failed step (it was lost before)",
    async () => {
      const s = sandbox(null, "stall-x", { calculator: never });
      script = [nativeCall("calculator", { expression: "1+1" })];
      await withWatchdog(quiet(() => s.agent.runAgent("حساب کن")));
      const rec = s.records();
      assert.equal(rec.length, 1);
      assert.equal(rec[0].success, false);
      assert.match(rec[0].error, /timed out/);
      assert.equal(rec[0].actions.length, 1);
      assert.equal(rec[0].actions[0].tool, "calculator");
      assert.equal(rec[0].actions[0].success, false);
    },
  );
  await t(
    "stalled tool -> the run stops: no further model call is made after the timeout",
    async () => {
      const s = sandbox(null, "stall-stop", { calculator: never });
      script = [
        nativeCall("calculator", { expression: "1+1" }),
        finish,
        finish,
      ];
      await withWatchdog(quiet(() => s.agent.runAgent("حساب کن")));
      assert.equal(
        script.length,
        2,
        "model was called again after the failed step",
      );
    },
  );
  await t(
    "multi-step: 1st tool ok, 2nd tool stalls -> history has both steps (ok, then timed out)",
    async () => {
      const s = sandbox(null, "multi", {
        calculator: async () => ({ success: true, result: "2" }),
        date: never,
      });
      script = [
        nativeCall("calculator", { expression: "1+1" }),
        nativeCall("date", {}),
        finish,
      ];
      const r = await withWatchdog(
        quiet(() => s.agent.runAgent("حساب کن و تاریخ بگو")),
      );
      assert.equal(r.success, false);
      assert.deepEqual(
        r.history.map((h) => [h.tool, h.success]),
        [
          ["calculator", true],
          ["date", false],
        ],
      );
      assert.equal(s.records()[0].actions.length, 2);
    },
  );
  await t("timer is cleared when the stalled tool times out", async () => {
    resetTimers();
    const s = sandbox(null, "stall-timer", { calculator: never });
    script = [nativeCall("calculator", { expression: "1" })];
    await withWatchdog(quiet(() => s.agent.runAgent("x")));
    assert.equal(budgetTimers.size, 1);
    assert.equal(clearedBudgetTimers.size, 1);
  });

  // 2. ordinary outcomes must be unchanged
  const ordinary = {
    "fast success": {
      calculator: async () => ({ success: true, result: "100" }),
    },
    "tool returns success=false": {
      calculator: async () => ({
        success: false,
        error: "Invalid calculation",
      }),
    },
    "tool throws / rejects": {
      calculator: async () => {
        throw new Error("boom");
      },
    },
    "tool resolves slowly but inside the budget": {
      calculator: () =>
        new Promise((r) =>
          realSetTimeout(() => r({ success: true, result: "slow-ok" }), 20),
        ),
    },
  };
  const ordinaryResults = {};
  for (const [label, handlers] of Object.entries(ordinary)) {
    await t(
      `ordinary outcome [${label}] -> normal result, timer cleared`,
      async () => {
        resetTimers();
        const s = sandbox(null, "ord", handlers);
        script = [nativeCall("calculator", { expression: "1+1" }), finish];
        const r = await withWatchdog(quiet(() => s.agent.runAgent("حساب کن")));
        assert.notEqual(r, "__HANG__");
        ordinaryResults[label] = JSON.parse(JSON.stringify(r));
        assert.ok(
          !/timed out/.test(JSON.stringify(r)),
          "must not report a timeout",
        );
        assert.equal(budgetTimers.size, 1);
        assert.equal(clearedBudgetTimers.size, 1, "timer leaked");
      },
    );
  }
  await t("ordinary results have the expected content", () => {
    assert.equal(ordinaryResults["fast success"].success, true);
    assert.equal(
      ordinaryResults["tool returns success=false"].error,
      "Invalid calculation",
    );
    assert.equal(ordinaryResults["tool throws / rejects"].error, "boom");
    assert.equal(
      ordinaryResults["tool throws / rejects"].history[0].result,
      "ERROR: boom",
    );
    assert.equal(
      ordinaryResults["tool resolves slowly but inside the budget"].history[0]
        .result,
      "slow-ok",
    );
  });

  // 3. late settlement after the timeout must be harmless
  await t(
    "tool that REJECTS after the timeout -> no unhandled rejection, result stays 'timed out'",
    async () => {
      unhandled.length = 0;
      const s = sandbox(null, "late-rej", {
        calculator: () =>
          new Promise((_, rej) =>
            realSetTimeout(
              () => rej(new Error("late failure")),
              TEST_BUDGET + 100,
            ),
          ),
      });
      script = [nativeCall("calculator", { expression: "1" })];
      const r = await withWatchdog(quiet(() => s.agent.runAgent("x")));
      await sleep(TEST_BUDGET + 250);
      assert.match(r.error, /timed out/);
      assert.deepEqual(unhandled, []);
    },
  );
  await t(
    "tool that RESOLVES after the timeout -> no effect on the returned result",
    async () => {
      const s = sandbox(null, "late-ok", {
        calculator: () =>
          new Promise((res) =>
            realSetTimeout(
              () => res({ success: true, result: "late" }),
              TEST_BUDGET + 100,
            ),
          ),
      });
      script = [nativeCall("calculator", { expression: "1" })];
      const r = await withWatchdog(quiet(() => s.agent.runAgent("x")));
      await sleep(TEST_BUDGET + 250);
      assert.equal(r.success, false);
      assert.match(r.error, /timed out/);
    },
  );

  // 4. comparison with the ORIGINAL agent
  if (fs.existsSync(BAK)) {
    await t(
      "original agent has no executeToolWithTimeout (it is really the old file)",
      () =>
        assert.ok(
          !fs.readFileSync(BAK, "utf8").includes("executeToolWithTimeout"),
        ),
    );
    await t(
      "ORIGINAL agent HANGS on the stalled tool (this is the weakness being fixed)",
      async () => {
        const s = sandbox(BAK, "orig-stall", { calculator: never });
        script = [nativeCall("calculator", { expression: "1+1" })];
        const r = await withWatchdog(
          quiet(() => s.agent.runAgent("حساب کن")),
          800,
        );
        assert.equal(r, "__HANG__", "the original agent unexpectedly returned");
        assert.equal(s.records().length, 0, "and nothing was recorded");
      },
    );
    for (const [label, handlers] of Object.entries(ordinary)) {
      await t(
        `ordinary outcome [${label}] -> result identical to the ORIGINAL agent`,
        async () => {
          const s = sandbox(BAK, "orig-ord", handlers);
          script = [nativeCall("calculator", { expression: "1+1" }), finish];
          const r = await withWatchdog(
            quiet(() => s.agent.runAgent("حساب کن")),
          );
          assert.deepEqual(
            JSON.parse(JSON.stringify(r)),
            ordinaryResults[label],
          );
        },
      );
    }
  } else
    console.log(
      "SKIP  comparison with the original: agent.js.before-tool-timeout.bak not found",
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

  global.setTimeout = realSetTimeout;
  global.clearTimeout = realClearTimeout;
  for (const d of created) fs.rmSync(d, { recursive: true, force: true });
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
