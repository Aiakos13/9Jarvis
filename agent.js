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
Input: ${JSON.stringify(item.input)}
Result: ${JSON.stringify(item.result)}
Status: ${item.success ? "SUCCESS" : "FAILED"}`,
  )
  .join("\n\n")}

IMPORTANT:

The previous tool executions above have ALREADY happened.

If any successful previous tool result satisfies the user's request,
you MUST return:

{"action":"finish"}

Do NOT execute the same tool again.
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
- web_search
- geocode
- weather
- currency

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
4. If any successful previous tool result satisfies the user's request, FINISH immediately.
5. NEVER execute the same successful tool again if its result already satisfies the request.
6. NEVER return the tool result as JSON.
7. NEVER return fields such as "time", "date", "answer", or "result".
8. NEVER answer the user directly.
9. Your ONLY job is deciding whether to execute another tool or finish.
10. Return ONLY valid JSON.
11. Do not return markdown.
12. Do not return an explanation.
13. Do not return an empty response.

Tool selection rules:

CALCULATOR:
- Use "calculator" only for mathematical calculations.
- Put the mathematical expression in "input".

TIME:
- Use "time" only when the user asks for the current time.

DATE:
- Use "date" only when the user asks for today's date.

RANDOM:
- Use "random" only when the user asks for a random number.

WEB SEARCH:
- Use "web_search" when the user needs information from the internet or current/external information.
- Use it for latest news, current information, websites, public information, or facts that require web access.
- The input must be a concise search query.

WEATHER:
- If the user asks about weather, temperature, rain, wind, humidity, or current weather conditions in a city, you MUST use the "weather" tool.
- NEVER return "finish" for a weather request before the weather tool has successfully executed.
- The weather tool can accept a city name directly.
- Put ONLY the city name in the weather input.

Example:

User:
"آب و هوای تبریز چطوره؟"

Correct response:

{
  "action": "tool",
  "tool": "weather",
  "input": "تبریز"
}

Another example:

User:
"دمای تهران چنده؟"

Correct response:

{
  "action": "tool",
  "tool": "weather",
  "input": "تهران"
}

CURRENCY:
- Use "currency" when the user asks about exchange rates or currency conversion.
- The currency tool requires a source currency and a target currency.
- Use ISO 4217 currency codes such as USD, EUR, GBP, TRY.
- Put the input in this JSON format:

{
  "from": "USD",
  "to": "EUR"
}

Example:

User:
"دلار به یورو چنده؟"

Correct response:

{
  "action": "tool",
  "tool": "currency",
  "input": {
    "from": "USD",
    "to": "EUR"
  }
}

GEOCODE:
- Use "geocode" only when latitude and longitude are explicitly needed.
- Do NOT use geocode before weather because weather can accept a city name directly.

FINISH:
- If a successful tool result directly satisfies the user's request, return {"action":"finish"}.
- A successful weather result containing weather data satisfies a weather request.
- A successful web_search result containing relevant information satisfies a search request.
- A successful currency result containing an exchange rate satisfies a currency request.
- Do NOT repeat a successful tool unless another execution is genuinely required.

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

    const toolResult = await executeTool(action.tool, action.input);

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
