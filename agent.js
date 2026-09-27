const OpenAI = require("openai");

const { validateToolData } = require("./toolValidator");
const { executeTool } = require("./tools");
const config = require("./config");

const client = new OpenAI({
  apiKey: config.openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

const MAX_STEPS = 5;
const MAX_RETRIES = 2;

async function askAgentForNextAction(userInput, history) {
  const context = history.length
    ? `
Previous tool executions:

${history
  .map(
    (item, index) =>
      `Step ${index + 1}
Tool: ${item.tool}
Input: ${item.input}
Result: ${item.result}
Status: SUCCESS`,
  )
  .join("\n\n")}

IMPORTANT:

The previous tool executions above have ALREADY happened.

If one of those successful tool results satisfies the user's request,
you MUST return:

{"action":"finish"}

Do NOT execute the same tool again.

Example:

User request:
"یک عدد تصادفی بده"

Previous execution:
Tool: random
Result: 72
Status: SUCCESS

Correct response:
{"action":"finish"}

NOT:
{"action":"tool","tool":"random","input":null}
`
    : `
No tools have been executed yet.
`;

  const response = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `
You are the decision-making agent of 9Jarvis.

Your ONLY job is to decide what tool should be executed next.

Available tools:
- calculator
- time
- date
- random

You MUST return ONLY valid JSON.

FORMAT 1 — USE A TOOL:

{
  "action": "tool",
  "tool": "calculator",
  "input": "25 * 4"
}

FORMAT 2 — FINISH:

{
  "action": "finish"
}

Rules:

1. Never invent a tool.
2. Only use the available tools.
3. If the user's request requires a tool and it has NOT been executed yet, use that tool.
4. If a successful previous tool result already satisfies the user's request, FINISH.
5. NEVER execute the same tool again if its successful result already satisfies the request.
6. NEVER return the tool result as JSON.
7. NEVER return fields such as "time", "date", "answer", or "result".
8. NEVER answer the user directly.
9. Your ONLY job is deciding whether to execute another tool or finish.
10. Return ONLY valid JSON.
11. Do not return markdown.
12. Do not return an explanation.
13. Do not return an empty response.

${context}
`,
      },
      {
        role: "user",
        content: userInput,
      },
    ],
  });

  const content = response?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new Error("Agent returned an empty response.");
  }

  return content.trim();
}

function parseAgentAction(rawAction) {
  if (!rawAction || typeof rawAction !== "string") {
    return {
      valid: false,
      error: "Agent returned an empty response.",
    };
  }

  let action;

  try {
    action = JSON.parse(rawAction);
  } catch {
    return {
      valid: false,
      error: "Agent returned invalid JSON.",
    };
  }

  if (!action || typeof action !== "object") {
    return {
      valid: false,
      error: "Agent returned invalid action data.",
    };
  }

  if (action.action === "finish") {
    return {
      valid: true,
      data: {
        action: "finish",
      },
    };
  }

  if (action.action !== "tool") {
    return {
      valid: false,
      error: "Agent returned an unknown action.",
    };
  }

  if (typeof action.tool !== "string") {
    return {
      valid: false,
      error: "Agent returned an invalid tool name.",
    };
  }

  const validation = validateToolData({
    needsTool: true,
    tool: action.tool,
    input: action.input,
  });

  if (!validation.valid) {
    return {
      valid: false,
      error: validation.error,
    };
  }

  return {
    valid: true,
    data: {
      action: "tool",
      tool: validation.data.tool,
      input: validation.data.input,
    },
  };
}

async function getNextActionWithRetry(userInput, history) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const rawAction = await askAgentForNextAction(userInput, history);

      const parsed = parseAgentAction(rawAction);

      if (parsed.valid) {
        return parsed;
      }

      lastError = new Error(parsed.error);
    } catch (error) {
      lastError = error;
    }
  }

  return {
    valid: false,
    error: lastError?.message || "Agent failed to return a valid action.",
  };
}

async function runAgent(userInput) {
  const history = [];

  if (!userInput || typeof userInput !== "string") {
    return {
      success: false,
      error: "Invalid user input.",
      history,
    };
  }

  for (let step = 0; step < MAX_STEPS; step++) {
    const parsed = await getNextActionWithRetry(userInput, history);

    if (!parsed.valid) {
      return {
        success: false,
        error: `Agent request failed: ${parsed.error}`,
        history,
      };
    }

    const action = parsed.data;

    if (action.action === "finish") {
      return {
        success: true,
        finished: true,
        history,
      };
    }

    const toolResult = executeTool(action.tool, action.input);

    history.push({
      step: step + 1,
      tool: action.tool,
      input: action.input,
      success: toolResult.success,
      result: toolResult.success
        ? toolResult.result
        : `ERROR: ${toolResult.error}`,
    });

    if (!toolResult.success) {
      return {
        success: false,
        error: toolResult.error,
        history,
      };
    }
  }

  return {
    success: false,
    error: "Agent reached maximum number of steps.",
    history,
  };
}

module.exports = {
  runAgent,
};
