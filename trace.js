// READ-ONLY AUDIT TRACE (scratch file, not part of the project).
// Runs the project's real main.js in a scratch copy with the network and OS stubbed:
//   - 'openai' is replaced by a fake client that records every request (endpoint, payload size, order, timing)
//     and answers with canned data after a SYNTHETIC delay.
//   - 'dotenv' is a no-op, readline feeds one input then "exit", child_process.execFile is a no-op.
// It measures STRUCTURE (how many calls, in which order, how many bytes) - not real latency.
// Usage: node trace.js <repo dir> "<user input>" [remoteDelayMs] [localDelayMs]
"use strict";
const path = require("path");
const Module = require("module");
const cp = require("child_process");
const readline = require("readline");

const repo = path.resolve(process.argv[2]);
const INPUT = process.argv[3];
const REMOTE_MS = Number(process.argv[4] || 300);
const LOCAL_MS = Number(process.argv[5] || 500);
process.env.OPENROUTER_API_KEY = "dummy-not-a-real-key";
process.chdir(require("os").tmpdir());

const t0 = Date.now();
const trace = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class FakeOpenAI {
  constructor(opts) {
    this.local = /localhost|127\.0\.0\.1/.test(opts.baseURL || "");
    this.chat = { completions: { create: (p, o) => this.create(p, o) } };
  }
  async create(params) {
    const sys = String(
      (params.messages.find((m) => m.role === "system") || {}).content || "",
    );
    const user = params.messages[params.messages.length - 1].content;
    const userText = typeof user === "string" ? user : JSON.stringify(user);
    let kind = "other";
    if (/memory query detector/.test(sys)) kind = "memory-query-detector";
    else if (/memory detector/.test(sys)) kind = "memory-detector";
    else if (/tool detector/.test(sys)) kind = "tool-detector";
    else if (/decision-making agent/.test(sys)) kind = "agent-step";
    else if (/Analyze the screenshot/.test(sys)) kind = "vision";
    else if (/personal AI assistant/.test(sys)) kind = "final-response";
    const bytes = Buffer.byteLength(JSON.stringify(params));
    const entry = {
      kind,
      where: this.local ? "LOCAL " : "REMOTE",
      start: Date.now() - t0,
      bytes,
      tools: params.tools ? Buffer.byteLength(JSON.stringify(params.tools)) : 0,
      sys: Buffer.byteLength(sys),
      model: params.model,
    };
    trace.push(entry);
    await sleep(this.local ? LOCAL_MS : REMOTE_MS);
    entry.end = Date.now() - t0;
    const usage = {
      prompt_tokens: Math.round(bytes / 4),
      completion_tokens: 20,
    };
    const msg = (m) => ({
      choices: [{ message: m, finish_reason: "stop" }],
      usage,
    });
    switch (kind) {
      case "memory-detector":
        return msg({ content: '{"shouldRemember":false}' });
      case "memory-query-detector":
        return msg({ content: '{"needsMemory":false,"memories":[]}' });
      case "agent-step":
        if (/No tools have been executed yet/.test(userText))
          return msg({
            tool_calls: [
              {
                type: "function",
                function: {
                  name: process.env.TRACE_TOOL || "open_url",
                  arguments: process.env.TRACE_TOOL
                    ? "{}"
                    : JSON.stringify({ url: "https://example.com" }),
                },
              },
            ],
          });
        return msg({
          tool_calls: [
            { type: "function", function: { name: "finish", arguments: "{}" } },
          ],
        });
      case "final-response":
        return msg({ content: "Done." });
      default:
        return msg({ content: "{}" });
    }
  }
}

const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "openai") return FakeOpenAI;
  if (request === "dotenv") return { config() {} };
  return origLoad.apply(this, arguments);
};
cp.execFile = (file, args, opts, cb) => {
  cb = [args, opts, cb].find((x) => typeof x === "function");
  if (cb) cb(null, "", "");
  return { unref() {} };
};
let served = false;
readline.createInterface = () => ({
  question(_p, cb) {
    setImmediate(() => cb(served ? "exit" : ((served = true), INPUT)));
  },
  close() {
    report();
  },
});

let logged = 0,
  loggedBytes = 0;
const origLog = console.log,
  origErr = console.error;
const wrap =
  (orig) =>
  (...a) => {
    const s = a
      .map((x) => (typeof x === "string" ? x : JSON.stringify(x)))
      .join(" ");
    logged++;
    loggedBytes += Buffer.byteLength(s) + 1;
  };
console.log = wrap(origLog);
console.error = wrap(origErr);

function report() {
  console.log = origLog;
  console.error = origErr;
  const total = Date.now() - t0;
  console.log(
    `input: ${JSON.stringify(INPUT)}   synthetic delays: remote=${REMOTE_MS}ms local=${LOCAL_MS}ms (NOT real latency)`,
  );
  console.log(
    "order  where   kind                    start    end   request bytes (system / tools)",
  );
  trace.forEach((e, i) =>
    console.log(
      `${String(i + 1).padStart(3)}    ${e.where}  ${e.kind.padEnd(22)} ${String(e.start).padStart(5)}  ${String(e.end).padStart(5)}   ${String(e.bytes).padStart(6)} (${e.sys} / ${e.tools})`,
    ),
  );
  const overlaps = trace.some((a, i) =>
    trace.some((b, j) => j > i && b.start < a.end),
  );
  const remote = trace.filter((e) => e.where === "REMOTE"),
    local = trace.filter((e) => e.where === "LOCAL ");
  console.log(
    `remote calls=${remote.length}  local calls=${local.length}  any two calls overlapping in time: ${overlaps}`,
  );
  console.log(
    `wall time=${total}ms  sum of call durations=${trace.reduce((s, e) => s + (e.end - e.start), 0)}ms`,
  );
  console.log(
    `console output produced by the app for this single request: ${logged} lines, ${loggedBytes} bytes`,
  );
  process.exit(0);
}
require(path.join(repo, "main.js"));
