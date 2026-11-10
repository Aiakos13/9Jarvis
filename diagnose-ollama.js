// 9Jarvis - Ollama connection diagnosis (READ-ONLY, runs OUTSIDE the project).
//
//   node diagnose-ollama.js "G:\File and video\9jarvis"  [--timeout 120000] [--no-sdk]
//
// What it does
//   1. Prints the EFFECTIVE Ollama settings the app would use (.env wins over the environment, like config.js).
//      Only OLLAMA_BASE_URL / OLLAMA_MODEL are read from .env. Nothing else from .env is read or printed.
//   2. Tests the network layer from Node itself (not curl): DNS, TCP connect and GET /models for the configured
//      host and for localhost / 127.0.0.1 / [::1].
//   3. Captures the EXACT request the Agent sends (real agent.js, with the OpenAI client stubbed, so nothing is
//      sent and no tool is executed), then replays it against Ollama in four steps: simple chat, one tool,
//      all tools, full Agent payload. Each step runs with raw fetch and with the project's real openai SDK.
//   4. If the full payload fails, it bisects which request field triggers the failure.
//   5. Prints a VERDICT. Tool calls returned by the model are only listed by name, never run.
// The script never prints API keys, .env contents, prompts or memory. It sends nothing except to the Ollama URL.
"use strict";
const fs = require("fs");
const path = require("path");
const net = require("net");
const dns = require("dns").promises;
const Module = require("module");

const args = process.argv.slice(2);
const projectDir = path.resolve(args.find((a) => !a.startsWith("--")) || ".");
const tIdx = args.indexOf("--timeout");
const TIMEOUT = tIdx >= 0 ? Number(args[tIdx + 1]) : 120000;
const USE_SDK = !args.includes("--no-sdk");
const log = (...a) => console.log(...a);
const section = (t) => log(`\n=== ${t} ===`);

// ---------- error helpers ----------
const fmt = (c) =>
  `${c && c.name}: ${c && c.message}` +
  (c && c.status ? ` [HTTP ${c.status}]` : "") +
  (c && c.code ? ` [code=${c.code}]` : "") +
  (c && c.errno && typeof c.errno !== "object" ? ` errno=${c.errno}` : "") +
  (c && c.syscall ? ` syscall=${c.syscall}` : "") +
  (c && c.address ? ` addr=${c.address}${c.port ? ":" + c.port : ""}` : "");
function chain(e) {
  const out = [];
  let c = e,
    d = 0;
  while (c && d < 6) {
    out.push(fmt(c));
    if (Array.isArray(c.errors))
      for (const s of c.errors) out.push("    - " + fmt(s));
    c = c.cause;
    d++;
  }
  return out;
}
function codeOf(e) {
  let c = e,
    d = 0;
  const codes = [];
  while (c && d < 6) {
    if (c.code) codes.push(String(c.code));
    if (Array.isArray(c.errors))
      c.errors.forEach((s) => s.code && codes.push(String(s.code)));
    c = c.cause;
    d++;
  }
  return codes;
}
function meaning(e) {
  const codes = codeOf(e);
  const text = chain(e).join(" ");
  if (e && e.status)
    return `server answered HTTP ${e.status}: the connection worked, Ollama rejected or failed the request`;
  if (codes.includes("ECONNREFUSED"))
    return "nothing is listening on that address:port (wrong host / IPv4-vs-IPv6 / Ollama not serving there)";
  if (
    codes.includes("ECONNRESET") ||
    codes.includes("UND_ERR_SOCKET") ||
    /other side closed|socket hang up|terminated/i.test(text)
  )
    return "the server (or something in between) closed the connection while the request was in flight";
  if (
    codes.includes("UND_ERR_HEADERS_TIMEOUT") ||
    codes.includes("UND_ERR_BODY_TIMEOUT")
  )
    return "the server accepted the connection but did not answer in time";
  if (codes.includes("ETIMEDOUT") || codes.includes("UND_ERR_CONNECT_TIMEOUT"))
    return "TCP connect timed out (firewall / proxy / wrong address)";
  if (codes.includes("ENOTFOUND") || codes.includes("EAI_AGAIN"))
    return "host name did not resolve";
  if (e && (e.name === "TimeoutError" || e.name === "AbortError"))
    return `no complete answer within ${TIMEOUT} ms (script timeout)`;
  if (/ByteString|Invalid URL|ERR_INVALID/i.test(text))
    return "the request could not be built (invalid URL or header value) - it never left Node";
  return "unclassified - read the cause chain above";
}
const origin = (base) => new URL(base).origin;

// ---------- 0. effective settings ----------
function readEnvKeys(file, keys) {
  const out = {};
  let txt;
  try {
    txt = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  } catch {
    return { found: false, out };
  }
  for (const line of txt.split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(
      line,
    );
    if (!m || !keys.includes(m[1])) continue;
    let v = m[2].trim();
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, "");
    out[m[1]] = v;
  }
  return { found: true, out };
}
const envFile = readEnvKeys(path.join(projectDir, ".env"), [
  "OLLAMA_BASE_URL",
  "OLLAMA_MODEL",
]);
const pick = (name, dflt) => {
  if (envFile.out[name] !== undefined) {
    return envFile.out[name]
      ? [envFile.out[name], ".env (overrides environment, as in config.js)"]
      : [dflt, "built-in default in config.js (empty .env value)"];
  }
  return process.env[name]
    ? [process.env[name], "process environment"]
    : [dflt, "built-in default in config.js"];
};const [BASE_URL, baseSrc] = pick(
  "OLLAMA_BASE_URL",
  "http://localhost:11434/v1",
);
const [MODEL, modelSrc] = pick("OLLAMA_MODEL", "qwen3:4b-instruct");
const base = BASE_URL.replace(/\/+$/, "");

section("0. environment and effective settings");
log(
  `node ${process.version} on ${process.platform}; project dir: ${projectDir}`,
);
log(`.env present: ${envFile.found}`);
log(`OLLAMA_BASE_URL = ${BASE_URL}   (from ${baseSrc})`);
log(`OLLAMA_MODEL    = ${MODEL}   (from ${modelSrc})`);
const proxyVars = [
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "NODE_USE_ENV_PROXY",
  "NODE_EXTRA_CA_CERTS",
];
log(
  "proxy-related variables (set/unset only): " +
    proxyVars
      .map(
        (v) =>
          `${v}=${process.env[v] || process.env[v.toLowerCase()] ? "set" : "unset"}`,
      )
      .join("  "),
);
log(`NODE_OPTIONS = ${process.env.NODE_OPTIONS ? "set" : "unset"}`);
let sdkVersion = null,
  OpenAI = null;
if (USE_SDK) {
  try {
    const pkgDir = path.join(projectDir, "node_modules", "openai");
    sdkVersion = JSON.parse(
      fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"),
    ).version;
    const mod = require(pkgDir);
    OpenAI = mod.default || mod.OpenAI || mod;
  } catch (e) {
    log(
      `openai SDK not loadable from the project (${e.code || e.message}); SDK steps will be skipped`,
    );
  }
}
log(`openai SDK: ${sdkVersion || "not used"}`);

// ---------- 1. network layer ----------
const results = { net: {}, steps: [], bisect: [], serverLog: null };
async function tcp(host, port, ms = 4000) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    const s = net.connect({ host, port });
    const done = (r) => {
      s.destroy();
      resolve({ ...r, ms: Date.now() - t0 });
    };
    s.setTimeout(ms, () =>
      done({
        ok: false,
        err: {
          name: "Timeout",
          message: `no connect within ${ms} ms`,
          code: "ETIMEDOUT",
        },
      }),
    );
    s.once("connect", () => done({ ok: true, addr: s.remoteAddress }));
    s.once("error", (err) => done({ ok: false, err }));
  });
}
async function getJson(url, ms = 10000) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms) });
    const body = await r.text();
    return { ok: r.ok, status: r.status, ms: Date.now() - t0, body };
  } catch (err) {
    return { ok: false, err, ms: Date.now() - t0 };
  }
}
async function netTests() {
  section("1. network layer from Node (no SDK)");
  const u = new URL(base);
  const port = Number(u.port || 80);
  const hosts = [...new Set([u.hostname, "localhost", "127.0.0.1", "[::1]"])];
  for (const h of hosts) {
    const bare = h.replace(/^\[|\]$/g, "");
    let resolved = "(literal)";
    if (!net.isIP(bare)) {
      try {
        resolved = (await dns.lookup(bare, { all: true }))
          .map((a) => a.address)
          .join(", ");
      } catch (e) {
        resolved = `lookup failed: ${e.code}`;
      }
    }
    const c = await tcp(bare, port);
    const g = await getJson(
      `${u.protocol}//${h}:${port}${u.pathname.replace(/\/+$/, "")}/models`,
    );
    results.net[h] = { tcp: c.ok, get: g.ok };
    log(
      `${h === u.hostname ? "*" : " "} ${h.padEnd(10)} resolves to ${resolved}`,
    );
    log(
      `    tcp connect: ${c.ok ? `ok (${c.ms} ms, ${c.addr})` : `FAILED (${c.ms} ms) ${fmt(c.err)}`}`,
    );
    log(
      `    GET /models: ${g.ok ? `ok HTTP ${g.status} (${g.ms} ms)` : g.err ? `FAILED (${g.ms} ms) ${chain(g.err).join(" <- ")}` : `HTTP ${g.status}`}`,
    );
  }
  log("(* = host used by the app)");
}

// ---------- 2. capture the real Agent request ----------
async function capture() {
  section(
    "2. capturing the exact Agent request (nothing is sent, no tool runs)",
  );
  const saved = {
    O: process.env.OLLAMA_BASE_URL,
    M: process.env.OLLAMA_MODEL,
    K: process.env.OPENROUTER_API_KEY,
  };
  process.env.OLLAMA_BASE_URL = BASE_URL;
  process.env.OLLAMA_MODEL = MODEL;
  if (!process.env.OPENROUTER_API_KEY)
    process.env.OPENROUTER_API_KEY = "dummy-not-used";
  const captured = [];
  class Fake {
    constructor() {
      this.chat = {
        completions: {
          create: async (params, opts) => {
            captured.push({ params: JSON.parse(JSON.stringify(params)), opts });
            return {
              choices: [
                {
                  message: {
                    tool_calls: [
                      {
                        type: "function",
                        function: { name: "finish", arguments: "{}" },
                      },
                    ],
                  },
                },
              ],
              usage: {},
            };
          },
        },
      };
    }
  }
  const orig = Module._load;
  Module._load = function (req) {
    if (req === "openai") return Fake;
    if (req === "dotenv") return { config() {} };
    return orig.apply(this, arguments);
  };
  const quiet = console.log;
  console.log = () => {};
  try {
    const agent = require(path.join(projectDir, "agent.js"));
    await agent.runAgent("\u0633\u0644\u0627\u0645");
  } finally {
    console.log = quiet;
    Module._load = orig;
    if (saved.O === undefined) delete process.env.OLLAMA_BASE_URL;
    else process.env.OLLAMA_BASE_URL = saved.O;

    if (saved.M === undefined) delete process.env.OLLAMA_MODEL;
    else process.env.OLLAMA_MODEL = saved.M;

    if (saved.K === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = saved.K;
  }
  const c = captured[0];
  if (!c)
    throw new Error("agent.js did not issue a request in the capture run");
  const p = c.params;
  log(
    `captured: model=${p.model} max_tokens=${p.max_tokens} tool_choice=${p.tool_choice} parallel_tool_calls=${p.parallel_tool_calls} messages=${p.messages.length} tools=${(p.tools || []).length}`,
  );
  log(
    `sizes: whole body ${Buffer.byteLength(JSON.stringify(p))} B, system prompt ${Buffer.byteLength(p.messages[0].content)} B, tool schemas ${Buffer.byteLength(JSON.stringify(p.tools || []))} B, user message ${Buffer.byteLength(String(p.messages[1].content))} B; SDK per-request options: ${JSON.stringify(c.opts)}`,
  );
  return c;
}

// ---------- 3. replay ----------
function summarize(j) {
  try {
    const m = j.choices && j.choices[0] && j.choices[0].message;
    if (!m) return "no choices in response";
    const tc = (m.tool_calls || []).map((t) => t.function && t.function.name);
    return `finish_reason=${j.choices[0].finish_reason} content=${JSON.stringify(String(m.content || "").slice(0, 60))} tool_calls=[${tc.join(",")}] usage=${j.usage ? `${j.usage.prompt_tokens}p/${j.usage.completion_tokens}c` : "n/a"}`;
  } catch {
    return "unparseable response";
  }
}
async function rawPost(body, ms = TIMEOUT) {
  const t0 = Date.now();
  try {
    const r = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer ollama",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ms),
    });
    const txt = await r.text();
    if (!r.ok) {
      const e = new Error(txt.slice(0, 200));
      e.status = r.status;
      e.name = "HTTPError";
      return { ok: false, ms: Date.now() - t0, err: e };
    }
    return { ok: true, ms: Date.now() - t0, info: summarize(JSON.parse(txt)) };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, err };
  }
}
async function sdkPost(body, opts) {
  if (!OpenAI) return { skipped: true };
  const t0 = Date.now();
  try {
    const client = new OpenAI({
      apiKey: "ollama",
      baseURL: BASE_URL,
      maxRetries: 0,
    });
    const r = await client.chat.completions.create(
      { ...body },
      {
        ...opts,
        timeout: Math.min((opts && opts.timeout) || TIMEOUT, TIMEOUT),
      },
    );
    return { ok: true, ms: Date.now() - t0, info: summarize(r) };
  } catch (err) {
    return { ok: false, ms: Date.now() - t0, err };
  }
}
async function probeAlive() {
  const o = origin(base);
  const a = await getJson(`${o}/api/tags`, 5000),
    ps = await getJson(`${o}/api/ps`, 5000);
  let loaded = "";
  try {
    loaded =
      JSON.parse(ps.body)
        .models.map(
          (m) =>
            `${m.name}${m.context_length ? " ctx=" + m.context_length : ""}${m.size_vram !== undefined ? " vram=" + Math.round(m.size_vram / 1e6) + "MB/" + Math.round(m.size / 1e6) + "MB" : ""}`,
        )
        .join("; ") || "(none loaded)";
  } catch {}
  return `Ollama after failure: /api/tags ${a.ok ? "answers" : "DOES NOT ANSWER"}; /api/ps ${ps.ok ? "answers" : "DOES NOT ANSWER"}${loaded ? "; loaded: " + loaded : ""}`;
}
function showResult(label, r) {
  if (r.skipped) return log(`    ${label}: skipped`);
  if (r.ok) return log(`    ${label}: OK   ${r.ms} ms  ${r.info}`);
  log(`    ${label}: FAIL ${r.ms} ms`);
  chain(r.err).forEach((l) => log("        " + l));
  log(`        meaning: ${meaning(r.err)}`);
}
async function replay(c) {
  section(
    `3. progressive replay against ${base} (model ${MODEL}, timeout ${TIMEOUT} ms, SDK retries disabled here)`,
  );
  const p = c.params,
    tools = p.tools || [];
  const hello = [{ role: "user", content: "\u0633\u0644\u0627\u0645" }];
  const steps = [
    [
      "1 simple chat",
      {
        model: MODEL,
        messages: [{ role: "user", content: "Reply with OK" }],
        max_tokens: 30,
        stream: false,
      },
    ],
    [
      "2 one native tool",
      {
        model: MODEL,
        messages: hello,
        max_tokens: 200,
        stream: false,
        tools: tools.slice(0, 1),
      },
    ],
    [
      "3 all native tools",
      { model: MODEL, messages: hello, max_tokens: 200, stream: false, tools },
    ],
    ["4 exact Agent payload", { ...p, model: MODEL, stream: false }],
  ];
  for (const [label, body] of steps) {
    log(`  step ${label}  (${Buffer.byteLength(JSON.stringify(body))} B)`);
    const raw = await rawPost(body);
    showResult("raw fetch ", raw);
    const sdk = await sdkPost(body, c.opts);
    showResult("openai SDK", sdk);
    results.steps.push({ label, raw, sdk });
    if (!raw.ok || (sdk && sdk.ok === false))
      log("    " + (await probeAlive()));
  }
  const s4 = results.steps[3];
  const s1ok = results.steps[0].raw.ok,
    s2ok = results.steps[1].raw.ok;
  if (!s4.raw.ok && s1ok) {
    section("4. bisecting the full Agent payload (raw fetch)");
    const base4 = { ...p, model: MODEL, stream: false };
    const drop = (...keys) => {
      const b = { ...base4 };
      keys.forEach((k) => delete b[k]);
      return b;
    };
    const variants = [
      ["without parallel_tool_calls", drop("parallel_tool_calls")],
      ["without tool_choice", drop("tool_choice")],
      ["without max_tokens", drop("max_tokens")],
      [
        "without tools / tool_choice / parallel_tool_calls",
        drop("tools", "tool_choice", "parallel_tool_calls"),
      ],
      [
        "short system prompt, tools kept",
        {
          ...base4,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            p.messages[1],
          ],
        },
      ],
      [
        "short user message, rest kept",
        {
          ...base4,
          messages: [
            p.messages[0],
            { role: "user", content: "\u0633\u0644\u0627\u0645" },
          ],
        },
      ],
    ];
    const BMS = Math.min(TIMEOUT, 30000);
    for (const [label, body] of variants) {
      const r = await rawPost(body, BMS);
      results.bisect.push({ label, r });
      showResult(label.padEnd(50), r);
    }
    // If the tools array is what breaks it, find out which tool schema(s) or how many.
    const toolsBreak = !results.steps[2].raw.ok;
    if (toolsBreak && s2ok && tools.length > 1) {
      section(
        "4b. which tool schema breaks the request? (each tool alone, then growing prefixes)",
      );
      const mk = (t) => ({
        model: MODEL,
        messages: hello,
        max_tokens: 50,
        stream: false,
        tools: t,
      });
      const bad = [];
      for (const t of tools) {
        const r = await rawPost(mk([t]), BMS);
        const n = t.function && t.function.name;
        log(
          `    only "${n}": ${
            r.ok
              ? "ok"
              : "FAIL (" +
                codeOf(r.err)
                  .concat(r.err.status ? ["HTTP " + r.err.status] : [])
                  .join(",") +
                ")"
          }`,
        );
        if (!r.ok) bad.push(n);
      }
      results.badTools = bad;
      const prefixes = [];
      for (const k of [5, 10, 15, tools.length]) {
        if (k > tools.length) continue;
        const r = await rawPost(mk(tools.slice(0, k)), BMS);
        prefixes.push([k, r.ok]);
        log(`    first ${k} tools together: ${r.ok ? "ok" : "FAIL"}`);
      }
      results.prefixes = prefixes;
    }
  }
}

// ---------- 5. server log ----------
function serverLog() {
  section("5. Ollama server log (last matching lines)");
  const f = process.env.LOCALAPPDATA
    ? path.join(process.env.LOCALAPPDATA, "Ollama", "server.log")
    : null;
  if (!f || !fs.existsSync(f))
    return log(
      `not found${f ? " at " + f : ""} (look in %LOCALAPPDATA%\\Ollama\\server.log)`,
    );
  const lines = fs
    .readFileSync(f, "utf8")
    .split(/\r?\n/)
    .slice(-400)
    .filter((l) =>
      /error|fail|panic|crash|terminated|exit status|out of memory|oom|cuda|runner|timeout|abort/i.test(
        l,
      ),
    );
  log(
    `${f}\n` +
      (lines.slice(-25).join("\n") ||
        "(no error-like lines in the last 400 lines)"),
  );
}

// ---------- 6. verdict ----------
function verdict() {
  section("6. VERDICT");
  const u = new URL(base),
    appHost = u.hostname;
  const appNet = results.net[appHost] || {};
  const otherOk = Object.entries(results.net)
    .filter(([h, r]) => h !== appHost && r.tcp && r.get)
    .map(([h]) => h);
  otherOk.sort((a, b) => (a === "127.0.0.1" ? -1 : b === "127.0.0.1" ? 1 : 0));
  const out = [];
  if (!appNet.tcp || !appNet.get) {
    if (otherOk.length)
      out.push(
        `ESTABLISHED: the app's host "${appHost}" fails from Node, but ${otherOk.join(", ")} works. Fix: set OLLAMA_BASE_URL=http://${otherOk[0]}:${u.port || 11434}/v1 in .env (this script does not edit it).`,
      );
    else
      out.push(
        `ESTABLISHED: Node cannot reach Ollama on any tested address (${Object.keys(results.net).join(", ")}). Check that Ollama is serving on port ${u.port || 11434}, firewall/VPN/proxy software, and the proxy variables printed in section 0.`,
      );
  }
  const failing = results.steps.find((s) =>
    s.sdk && !s.sdk.skipped ? s.sdk.ok === false : !s.raw.ok,
  );
  if (failing) {
    const rawOk = failing.raw.ok,
      sdkOk = !failing.sdk || failing.sdk.skipped || failing.sdk.ok;
    out.push(
      `FIRST FAILING STEP: ${failing.label}  (raw fetch: ${rawOk ? "ok" : "FAIL"}; SDK: ${failing.sdk && !failing.sdk.skipped ? (sdkOk ? "ok" : "FAIL") : "skipped"})`,
    );
    const sdkFailed = failing.sdk && !failing.sdk.skipped && !failing.sdk.ok;
    const e = sdkFailed ? failing.sdk.err : failing.raw.err;
    out.push(`  error meaning: ${meaning(e)}`);
    if (rawOk && !sdkOk)
      out.push(
        "  The same request works with raw fetch but not through the openai SDK: the problem is in the SDK/client layer (version, proxy/dispatcher, request options), not in Ollama.",
      );
    if (!rawOk && results.steps.indexOf(failing) > 0)
      out.push(
        `  Earlier, smaller requests worked, so the failure depends on what is IN the request (${failing.label}).`,
      );
    const okVariants = results.bisect.filter((b) => b.r.ok).map((b) => b.label);
    const narrow = okVariants.filter((l) => !/^without tools/.test(l));
    if (results.bisect.length) {
      if (narrow.length)
        out.push(
          `  Bisect: NARROW trigger found - the full payload succeeds when changed as: ${narrow.join(" | ")}.`,
        );
      else if (okVariants.length)
        out.push(
          "  Bisect: the full payload only succeeds without tools / tool_choice / parallel_tool_calls, and no single field alone fixes it: the tool definitions themselves are the trigger (see 4b).",
        );
      else
        out.push(
          "  Bisect: no variant helped, even without tools; the cause is not in the request fields (see server log and section 0).",
        );
    }
    if (results.badTools)
      out.push(
        results.badTools.length
          ? `  4b: these tool schemas fail even alone: ${results.badTools.join(", ")}.`
          : `  4b: no single tool fails alone; growing prefixes: ${results.prefixes.map(([k, ok]) => `${k}:${ok ? "ok" : "FAIL"}`).join(" ")} -> a size/count/combination effect (compare with ctx in /api/ps and the server log).`,
      );
  } else {
    const allRawOk =
      results.steps.length > 0 && results.steps.every((s) => s.raw.ok);
    const allSdkOk =
      results.steps.length > 0 &&
      results.steps.every((s) => s.sdk && !s.sdk.skipped && s.sdk.ok);
    const testedClientOk = USE_SDK ? allSdkOk : allRawOk;

    if (appNet.tcp && appNet.get && testedClientOk) {
      out.push(
        `NOT REPRODUCED: all ${USE_SDK ? "SDK" : "raw fetch"} requests succeeded. The failure may depend on the app runtime, environment, or intermittent conditions. Compare section 0 with the app settings.`,
      );
    } else if (USE_SDK && results.steps.length && !allSdkOk) {
      out.push(
        "INCONCLUSIVE: SDK tests were skipped or did not all succeed; raw fetch success alone cannot establish that the app's SDK path works.",
      );
    }
  }
  out.forEach((l) => log(l));
}

(async () => {
  await netTests();
  let c;
  try {
    c = await capture();
  } catch (e) {
    section("2. capture failed");
    chain(e).forEach((l) => log(l));
  }
  if (c) await replay(c);
  serverLog();
  verdict();
})();
