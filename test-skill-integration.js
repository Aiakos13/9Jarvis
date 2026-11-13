"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const Module = require("module");
const assert = require("node:assert/strict");

const projectDir = __dirname;
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

const originalLoad = Module._load;
const originalKey = process.env.OPENROUTER_API_KEY;
const requests = [];
const created = [];

class FakeOpenAI {
  constructor() {
    this.chat = {
      completions: {
        create: async (params) => {
          requests.push(params);
          return {
            choices: [{
              message: {
                content: null,
                tool_calls: [{
                  type: "function",
                  function: {
                    name: "finish",
                    arguments: "{}",
                  },
                }],
              },
              finish_reason: "tool_calls",
            }],
            usage: {},
          };
        },
      },
    };
  }
}

function makeSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "9j-skill-integration-"));
  created.push(dir);

  for (const file of FILES) {
    const source = path.join(projectDir, file);
    if (!fs.existsSync(source)) {
      throw new Error(`Missing required file: ${file}`);
    }
    fs.copyFileSync(source, path.join(dir, file));
  }

  const skillDir = path.join(dir, "skills", "deployops");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.mkdirSync(path.join(dir, "data"), { recursive: true });

  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    [
      "---",
      "name: deployops",
      "description: release deployment checklist",
      "---",
      "",
      "SKILL_BODY_SENTINEL_9JARVIS",
      "Use this checklist as guidance when preparing a software release.",
    ].join("\n"),
    "utf8",
  );

  return dir;
}

function getMessageText(message) {
  const content = message && message.content;

  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .filter((item) => item && item.type === "text")
      .map((item) => String(item.text || ""))
      .join("\n");
  }

  return "";
}

async function main() {
  for (const file of FILES) {
    assert.ok(
      fs.existsSync(path.join(projectDir, file)),
      `Required project file exists: ${file}`,
    );
  }

  process.env.OPENROUTER_API_KEY = "dummy-not-used";

  Module._load = function (request) {
    if (request === "openai") return FakeOpenAI;
    if (request === "dotenv") return { config() {} };
    return originalLoad.apply(this, arguments);
  };

  const sandbox = makeSandbox();
  const agent = require(path.join(sandbox, "agent.js"));

  assert.equal(typeof agent.runAgent, "function");

  // Scenario 1: A relevant Skill must reach the model request.
  const relevantResult = await agent.runAgent(
    "Prepare the release deployment checklist for deployops",
  );

  assert.equal(relevantResult.success, true, "Relevant request should finish successfully");
  assert.equal(requests.length, 1, "Relevant request should make one model call");

  const relevantMessages = requests[0].messages;
  const relevantUserMessage = relevantMessages.find((m) => m.role === "user");

  assert.ok(relevantUserMessage, "User message must exist");
  assert.ok(
    relevantMessages.some((m) => m.role === "system"),
    "System message must exist",
  );
  assert.ok(
    getMessageText(relevantUserMessage).includes("RELEVANT SKILLS (UNTRUSTED DATA)"),
    "Relevant Skill section must be present",
  );
  assert.ok(
    getMessageText(relevantUserMessage).includes("deployops"),
    "Skill name must reach the model",
  );
  assert.ok(
    getMessageText(relevantUserMessage).includes("SKILL_BODY_SENTINEL_9JARVIS"),
    "Skill body must reach the model",
  );
  console.log("PASS  Relevant Skill reaches the model request");

  // Scenario 2: An unrelated request must not receive that Skill.
  const unrelatedResult = await agent.runAgent(
    "What is the capital of Japan?",
  );

  assert.equal(unrelatedResult.success, true, "Unrelated request should finish successfully");
  assert.equal(requests.length, 2, "Unrelated request should make one additional model call");

  const unrelatedUserMessage = requests[1].messages.find(
    (m) => m.role === "user",
  );

  assert.ok(unrelatedUserMessage, "Second user message must exist");
  assert.ok(
    !getMessageText(unrelatedUserMessage).includes("SKILL_BODY_SENTINEL_9JARVIS"),
    "Unrelated Skill body must not reach the model",
  );
  assert.ok(
    !getMessageText(unrelatedUserMessage).includes("RELEVANT SKILLS (UNTRUSTED DATA)"),
    "Unrelated request must not contain a Skill section",
  );
  console.log("PASS  Unrelated Skill is excluded from the model request");

  console.log("\nSkill Integration: 2 passed, 0 failed");
}

main()
  .catch((error) => {
    console.error("\nSkill Integration test failed:");
    console.error(error.stack || error.message || error);
    process.exitCode = 1;
  })
  .finally(() => {
    Module._load = originalLoad;

    if (originalKey === undefined) {
      delete process.env.OPENROUTER_API_KEY;
    } else {
      process.env.OPENROUTER_API_KEY = originalKey;
    }

    for (const dir of created) {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        console.error(`Could not remove temporary folder: ${dir}`);
      }
    }

    for (const key of Object.keys(require.cache)) {
      if (created.some((dir) => key.startsWith(dir))) {
        delete require.cache[key];
      }
    }
  });
