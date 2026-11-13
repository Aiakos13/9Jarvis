// Real test of the experienceStore -> runAgent connection.
//
//   node test-experience-hook.js                     (run from the project folder)
//   node test-experience-hook.js "G:\File and video\9jarvis"
//
// Safety:
//   * It COPIES agent.js, config.js, toolValidator.js, tools.js, experienceStore.js (and test-agent.js) into a fresh
//     temporary folder and runs everything there. The project's data/experiences.jsonl is never written
//     (the test proves that at the end by comparing size and mtime before/after).
//   * .env is never read: `dotenv` and `openai` are replaced by stubs, no network request is made.
//   * The model is a scripted fake and child_process.execFile/spawn are recorders, so no application is opened or typed into.
//   * The only tool really executed is `calculator` (pure JavaScript).
//
// If agent.js.before-experience-hook.bak exists next to agent.js, the same scenarios are also run against that
// ORIGINAL agent and the results are compared one-to-one (proof that Agent behaviour did not change).
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
  "requestRetry.js",
];
for (const f of FILES)
  if (!fs.existsSync(path.join(projectDir, f))) {
    console.error(`missing ${f} in ${projectDir}`);
    process.exit(2);
  }

const FAKE_KEY = "sk-or-v1-FAKEFAKEFAKEFAKE1234567890";
const FAKE_BEARER = "Bearer FAKE.TOKEN.value-123456";
process.env.OPENROUTER_API_KEY = "dummy-not-used";

// ---------- stubs ----------
let script = []; // each entry: (params) => response
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
  return { unref() {}, on() {} };
};

// ---------- helpers ----------
const created = [];
function makeSandbox(srcDir, label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `9j-exp-${label}-`));
  created.push(dir);
  for (const f of FILES)
    fs.copyFileSync(path.join(srcDir, f), path.join(dir, f));
  return dir;
}
function freshRequire(dir, { toolsOverride } = {}) {
  for (const k of Object.keys(require.cache))
    if (k.startsWith(dir)) delete require.cache[k];
  if (toolsOverride) {
    const tl = require(path.join(dir, "tools.js"));
    toolsOverride(tl);
  }
  return require(path.join(dir, "agent.js"));
}
function readRecords(dir) {
  const f = path.join(dir, "data", "experiences.jsonl");
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) return [];
  return fs
    .readFileSync(f, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}
async function quiet(fn) {
  // run fn with console.log captured
  const orig = console.log;
  const lines = [];
  console.log = (...a) =>
    lines.push(
      a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" "),
    );
  try {
    return { value: await fn(), lines };
  } catch (error) {
    return { error, lines };
  } finally {
    console.log = orig;
  }
}

const SCENARIOS = {
  A_single_tool_success: {
    input: "25 ضرب 4 را با ابزار calculator حساب کن",
    script: () => [nativeCall("calculator", { expression: "25 * 4" }), finish],
    expect: { success: true, tools: ["calculator"] },
  },
  B_tool_failure: {
    input: "1 تقسیم بر 0 را حساب کن",
    script: () => [nativeCall("calculator", { expression: "1/0" })],
    expect: { success: false, tools: ["calculator"] },
  },
  C_chat_only: {
    input: "سلام",
    script: () => [finish],
    expect: { success: true, tools: [] },
  },
  D1_empty_input: { input: "", script: () => [], expectRecord: false },
  D2_whitespace_input: {
    input: "   \n ",
    script: () => [],
    expectRecord: false,
  },
  D3_non_string_input: { input: 12345, script: () => [], expectRecord: false },
  D4_null_input: { input: null, script: () => [], expectRecord: false },
};

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
const runScenario = async (agent, sc) => {
  script = sc.script();
  return quiet(() => agent.runAgent(sc.input));
};

(async () => {
  const realDataFile = path.join(projectDir, "data", "experiences.jsonl");
  const realBefore = fs.existsSync(realDataFile)
    ? fs.statSync(realDataFile)
    : null;
  const patchedSrc = fs.readFileSync(path.join(projectDir, "agent.js"), "utf8");
  console.log(
    `project: ${projectDir}\ntemp copies are created under: ${os.tmpdir()}\n`,
  );

  await t(
    "agent.js is connected (runAgentInternal + wrapper + import present)",
    () => {
      assert.equal(
        (
          patchedSrc.match(/async function runAgentInternal\(userInput\)/g) ||
          []
        ).length,
        1,
      );
      assert.equal(
        (patchedSrc.match(/async function runAgent\(userInput\)/g) || [])
          .length,
        1,
      );
      assert.equal(
        (patchedSrc.match(/require\("\.\/experienceStore"\)/g) || []).length,
        1,
      );
    },
  );

  await t(
    "module.exports keys unchanged: runAgent, parseAgentAction, normalizeNativeToolCall",
    () => {
      const dir = makeSandbox(projectDir, "exports");
      const agent = freshRequire(dir);
      assert.deepEqual(Object.keys(agent), [
        "runAgent",
        "parseAgentAction",
        "normalizeNativeToolCall",
      ]);
      for (const k of Object.keys(agent))
        assert.equal(typeof agent[k], "function");
    },
  );

  // ---- per-scenario recording ----
  const patchedResults = {};
  for (const [name, sc] of Object.entries(SCENARIOS)) {
    const dir = makeSandbox(projectDir, name);
    const agent = freshRequire(dir);
    const before = Date.now();
    const r = await runScenario(agent, sc);
    const wall = Date.now() - before;
    patchedResults[name] = r.error
      ? { threw: String(r.error.message) }
      : JSON.parse(JSON.stringify(r.value));
    const records = readRecords(dir);

    if (sc.expect)
      await t(
        `${name}: scenario really executed as scripted (success=${sc.expect.success}, tools=[${sc.expect.tools}])`,
        () => {
          assert.ok(!r.error, r.error && r.error.stack);
          assert.equal(
            r.value.success,
            sc.expect.success,
            JSON.stringify(r.value),
          );
          assert.deepEqual(
            r.value.history.map((h) => h.tool),
            sc.expect.tools,
          );
          assert.equal(
            script.length,
            0,
            "scripted model responses were not all consumed",
          );
        },
      );
    await t(
      `${name}: ${sc.expectRecord === false ? "NOT recorded" : "recorded exactly once"}`,
      () => {
        assert.ok(!r.error, r.error && r.error.stack);
        assert.equal(records.length, sc.expectRecord === false ? 0 : 1);
      },
    );
    if (sc.expectRecord === false) continue;

    const rec = records[0];
    await t(`${name}: record fields match the real run`, () => {
      assert.equal(rec.request, sc.input.trim());
      assert.equal(rec.success, r.value.success);
      assert.equal(rec.error, r.value.error ?? null);
      assert.equal(rec.actions.length, r.value.history.length);
      r.value.history.forEach((h, i) => {
        assert.equal(rec.actions[i].step, h.step);
        assert.equal(rec.actions[i].tool, h.tool);
        assert.equal(rec.actions[i].success, h.success);
        assert.equal(rec.actions[i].result, h.result);
      });
      assert.ok(typeof rec.id === "string" && rec.id.length > 0);
      assert.ok(Number.isFinite(Date.parse(rec.createdAt)));
      assert.ok(
        Number.isFinite(rec.durationMs) &&
          rec.durationMs >= 0 &&
          rec.durationMs <= wall + 50,
        `durationMs=${rec.durationMs}, wall=${wall}`,
      );
    });
  }

  await t("A: success run stores calculator=100 in the action", async () => {
    const dir = makeSandbox(projectDir, "A2");
    const agent = freshRequire(dir);
    await runScenario(agent, SCENARIOS.A_single_tool_success);
    const rec = readRecords(dir)[0];
    assert.equal(rec.success, true);
    assert.equal(rec.actions[0].tool, "calculator");
    assert.match(String(rec.actions[0].result), /100/);
  });
  await t(
    "B: failure run is stored with success=false, error text and the failed action",
    async () => {
      const dir = makeSandbox(projectDir, "B2");
      const agent = freshRequire(dir);
      await runScenario(agent, SCENARIOS.B_tool_failure);
      const rec = readRecords(dir)[0];
      assert.equal(rec.success, false);
      assert.equal(rec.error, "Invalid calculation");
      assert.equal(rec.actions[0].success, false);
      assert.match(String(rec.actions[0].result), /^ERROR:/);
    },
  );
  // ---- experience retrieval integration ----
  await t(
    "G: second run receives the successful workflow from the first run",
    async () => {
      const dir = makeSandbox(projectDir, "G-retrieval");
      const agent = freshRequire(dir);

      const input = "25 ضرب 4 را با ابزار calculator حساب کن";

      // First run: create a successful experience.
      script = [nativeCall("calculator", { expression: "25 * 4" }), finish];

      const firstRun = await quiet(() => agent.runAgent(input));

      assert.ok(!firstRun.error, firstRun.error?.stack);
      assert.equal(firstRun.value.success, true);

      const firstRecords = readRecords(dir);

      assert.equal(firstRecords.length, 1);
      assert.equal(firstRecords[0].success, true);
      assert.equal(firstRecords[0].actions[0].tool, "calculator");

      // Second run: capture the actual prompt sent to the model.
      let capturedUserContent = null;

      script = [
        (params) => {
          const userMessage = params.messages.find(
            (message) => message.role === "user",
          );

          capturedUserContent = userMessage?.content;

          return nativeCall("calculator", {
            expression: "25 * 4",
          })();
        },
        finish,
      ];

      const secondRun = await quiet(() => agent.runAgent(input));

      assert.ok(!secondRun.error, secondRun.error?.stack);
      assert.equal(secondRun.value.success, true);

      assert.ok(
        Array.isArray(capturedUserContent),
        "The second model request must contain user content",
      );

      const promptText = capturedUserContent
        .map((item) => item.text || "")
        .join("\n");

      assert.match(promptText, /RELEVANT PAST EXPERIENCES/);

      assert.match(promptText, /Successful workflow steps/);

      assert.match(promptText, /25 \* 4/);

      assert.match(promptText, /100/);

      assert.match(promptText, /untrusted historical guidance/i);

      assert.equal(
        readRecords(dir).length,
        2,
        "Both executions must be recorded",
      );
    },
  );
  // ---- experience reuse with a changed request ----
  await t(
    "H: retrieved experience does not replace the new request",
    async () => {
      const dir = makeSandbox(projectDir, "H-new-request");
      const agent = freshRequire(dir);

      const firstInput = "25 ضرب 4 را با ابزار calculator حساب کن";
      const secondInput = "25 ضرب 5 را با ابزار calculator حساب کن";

      script = [
        nativeCall("calculator", { expression: "25 * 4" }),
        finish,
      ];

      const firstRun = await quiet(() => agent.runAgent(firstInput));

      assert.ok(!firstRun.error, firstRun.error?.stack);
      assert.equal(firstRun.value.success, true);

      const firstRecords = readRecords(dir);

      assert.equal(firstRecords.length, 1);
      assert.equal(firstRecords[0].actions[0].input, "25 * 4");

      let capturedUserContent = null;

      script = [
        (params) => {
          const userMessage = params.messages.find(
            (message) => message.role === "user",
          );

          capturedUserContent = userMessage?.content;

          return nativeCall("calculator", {
            expression: "25 * 5",
          })();
        },
        finish,
      ];

      const secondRun = await quiet(() => agent.runAgent(secondInput));

      assert.ok(!secondRun.error, secondRun.error?.stack);
      assert.equal(secondRun.value.success, true);

      assert.ok(Array.isArray(capturedUserContent));

      const promptText = capturedUserContent
        .map((item) => item.text || "")
        .join("\n");

      assert.match(promptText, /RELEVANT PAST EXPERIENCES/);
      assert.match(promptText, /25 \* 4/);
      assert.match(promptText, /untrusted historical guidance/i);
      assert.match(promptText, /25 ضرب 5/);

      const records = readRecords(dir);

      assert.equal(records.length, 2);
      assert.equal(records[1].request, secondInput);
      assert.equal(records[1].success, true);
      assert.equal(records[1].actions[0].tool, "calculator");
      assert.equal(records[1].actions[0].input, "25 * 5");
      assert.equal(records[1].actions[0].result, 125);
    },
  );
  // ---- storage failure must not affect the Agent ----
  await t(
    "E: storage failure (data is a FILE) -> Agent result unchanged, no throw, warning logged",
    async () => {
      const dir = makeSandbox(projectDir, "E");
      fs.writeFileSync(path.join(dir, "data"), "i am a file, mkdir will fail");
      const agent = freshRequire(dir);
      const r = await runScenario(agent, SCENARIOS.A_single_tool_success);
      assert.ok(!r.error, "runAgent must not throw");
      assert.equal(r.value.success, true);
      assert.equal(r.value.history.length, 1);
      assert.ok(
        r.lines.some((l) => l.includes("Experience storage failed")),
        "warning must be logged",
      );
      assert.deepEqual(
        JSON.parse(JSON.stringify(r.value)),
        patchedResults.A_single_tool_success,
      );
    },
  );

  // ---- secrets ----
  await t(
    "F: secrets in the request are redacted in data/experiences.jsonl",
    async () => {
      const dir = makeSandbox(projectDir, "F");
      const agent = freshRequire(dir);
      script = [finish];
      await quiet(() =>
        agent.runAgent(`my key is ${FAKE_KEY} and header ${FAKE_BEARER}`),
      );
      const raw = fs.readFileSync(
        path.join(dir, "data", "experiences.jsonl"),
        "utf8",
      );
      assert.ok(!raw.includes(FAKE_KEY), "api key leaked");
      assert.ok(!raw.includes("FAKE.TOKEN.value-123456"), "bearer leaked");
      assert.ok(raw.includes("[REDACTED]"));
    },
  );

  // ---- exception inside the Agent: original error propagates AND failure is recorded ----
  await t(
    "I: exception inside the Agent -> same error is rethrown, failure experience recorded",
    async () => {
      const dir = makeSandbox(projectDir, "I");
      const agent = freshRequire(dir, {
        toolsOverride: (tl) => {
          tl.executeTool = async () => undefined;
        },
      }); // makes createHistoryItem throw
      script = [nativeCall("calculator", { expression: "1+1" })];
      const r = await quiet(() => agent.runAgent("calc please"));
      assert.ok(
        r.error instanceof TypeError,
        "the original TypeError must propagate",
      );
      const rec = readRecords(dir);
      assert.equal(rec.length, 1);
      assert.equal(rec[0].success, false);
      assert.equal(rec[0].error, r.error.message);
      assert.deepEqual(rec[0].actions, []);
      patchedResults.I_internal_throw = { threw: r.error.message };
    },
  );

  // ---- equivalence with the ORIGINAL agent ----
  const bak = path.join(projectDir, "agent.js.before-experience-hook.bak");
  if (fs.existsSync(bak)) {
    const dir = makeSandbox(projectDir, "orig");
    fs.copyFileSync(bak, path.join(dir, "agent.js"));
    await t(
      "G0: backup is the ORIGINAL agent (no experienceStore reference)",
      () =>
        assert.ok(!fs.readFileSync(bak, "utf8").includes("experienceStore")),
    );
    for (const [name, sc] of Object.entries(SCENARIOS)) {
      await t(
        `G: ${name} -> result identical to the original agent`,
        async () => {
          const agent = freshRequire(dir);
          const r = await runScenario(agent, sc);
          const orig = r.error
            ? { threw: String(r.error.message) }
            : JSON.parse(JSON.stringify(r.value));
          assert.deepEqual(patchedResults[name], orig);
        },
      );
    }
    await t(
      "G: internal exception -> identical error message to the original agent",
      async () => {
        const agent = freshRequire(dir, {
          toolsOverride: (tl) => {
            tl.executeTool = async () => undefined;
          },
        });
        script = [nativeCall("calculator", { expression: "1+1" })];
        const r = await quiet(() => agent.runAgent("calc please"));
        assert.equal(
          String(r.error && r.error.message),
          patchedResults.I_internal_throw.threw,
        );
      },
    );
    await t("G: the original agent writes NO experience file", () =>
      assert.equal(fs.existsSync(path.join(dir, "data")), false),
    );
  } else {
    console.log(
      "SKIP  G: agent.js.before-experience-hook.bak not found -> equivalence with the original agent not checked",
    );
  }

  // ---- existing test file against the patched agent ----
  const tf = path.join(projectDir, "test-agent.js");
  if (fs.existsSync(tf)) {
    await t(
      "J: existing test-agent.js still passes against the patched agent",
      () => {
        const dir = makeSandbox(projectDir, "J");
        fs.copyFileSync(tf, path.join(dir, "test-agent.js"));
        fs.writeFileSync(
          path.join(dir, "stub-preload.js"),
          `const M=require("module");const o=M._load;M._load=function(r){if(r==="openai")return class{constructor(){this.chat={completions:{create:async()=>{throw new Error("no network in test")}}}}};if(r==="dotenv")return{config(){}};return o.apply(this,arguments)};process.env.OPENROUTER_API_KEY="dummy";`,
        );
        const res = cp.spawnSync(
          process.execPath,
          ["-r", "./stub-preload.js", "test-agent.js"],
          { cwd: dir, encoding: "utf8" },
        );
        const m = /Total: (\d+) passed, (\d+) failed/.exec(res.stdout);
        assert.ok(m, "no Total line:\n" + res.stdout + res.stderr);
        assert.equal(m[2], "0", `test-agent.js reports ${m[2]} failures`);
        console.log(`      test-agent.js: ${m[1]} passed, ${m[2]} failed`);
      },
    );
  }

  await t(
    "K: the project's own data/experiences.jsonl was not touched by this test",
    () => {
      const after = fs.existsSync(realDataFile)
        ? fs.statSync(realDataFile)
        : null;
      assert.equal(!!after, !!realBefore);
      if (after) {
        assert.equal(after.size, realBefore.size);
        assert.equal(after.mtimeMs, realBefore.mtimeMs);
      }
    },
  );
  await t(
    "L: no application/process was spawned by the test (execFile/spawn recorders empty)",
    () => assert.deepEqual(spawned, []),
  );

  for (const d of created) fs.rmSync(d, { recursive: true, force: true });
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
