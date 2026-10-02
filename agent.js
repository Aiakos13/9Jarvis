const OpenAI = require("openai");

const { validateToolData } = require("./toolValidator");
const { executeTool } = require("./tools");
const config = require("./config");

const client = new OpenAI({
  apiKey: config.openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

const MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "deepseek/deepseek-v4.1-flash";

const MAX_STEPS = 5;
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 30000;

const AGENT_MAX_TOKENS = 2000;
const VISION_MAX_TOKENS = 3000;

const TOOL_NAMES = [
  "calculator",
  "time",
  "date",
  "random",
  "web_search",
  "geocode",
  "weather",
  "currency",
  "open_app",
  "open_url",
  "close_app",
  "press_key",
  "hotkey",
  "focus_app",
  "type_text",
  "open_default_browser",
  "mouse_click",
  "mouse_move",
  "mouse_double_click",
  "scroll",
  "screenshot",
];

const AGENT_SYSTEM_PROMPT = `
You are the decision-making agent of 9Jarvis.

Your ONLY job is to decide which tool should be executed next.

Available tools:
${TOOL_NAMES.map((tool) => `- ${tool}`).join("\n")}

You MUST return ONLY valid JSON.

VALID TOOL ACTION:
{
  "action": "tool",
  "tool": "calculator",
  "input": "25 * 4"
}

VALID FINISH ACTION:
{
  "action": "finish"
}

GENERAL RULES:

1. Never invent a tool.
2. Only use the available tools.
3. If the user's request requires a tool that has not been successfully executed, use that tool.
4. If a successful previous tool result already satisfies the user's request, return {"action":"finish"}.
5. Never repeat a successful tool when its result already satisfies the request.
6. Never return tool results yourself.
7. Never return fields such as "answer", "result", "time", or "date".
8. Never answer the user directly.
9. Your only job is tool selection.
10. Return exactly one JSON object.
11. Do not use markdown.
12. Do not explain your decision.
13. Do not return an empty response.

CALCULATOR:
- Use only for mathematical calculations.
- Input must be the mathematical expression.
- The calculator does not support ^.
- Rewrite powers using multiplication.

TIME:
- Use only for the current time.
- Input must be an empty string.

DATE:
- Use only for today's date.
- Input must be an empty string.

RANDOM:
- Use only when the user asks for a random number.
- Input must be an empty string.

WEB SEARCH:
- Use for general web searches, latest information, websites, public information, or facts requiring web access.
- Do not use for weather.
- Input must be a concise search query.

WEATHER:
- Use for weather, temperature, rain, wind, humidity, or current weather conditions.
- Input must contain only the city name.
- Never use web_search for weather.

CURRENCY:
- Use for currency conversion or exchange rates.
- Input:
{
  "from": "USD",
  "to": "EUR"
}

GEOCODE:
- Use only when latitude and longitude are explicitly required.
- Do not use before weather.

OPEN APP:
- Use when the user asks to open or launch an application.
- Input must contain only the application name.

OPEN URL:
- Use when the user explicitly asks to open, visit, or go to a website.
- Input must be the complete URL.
- Do not use web_search for simply opening a website.

CLOSE APP:
- Use when the user asks to close, quit, or terminate an application.
- Input must contain only the application name.

PRESS KEY:
- Use for a single keyboard key.
- Input must contain only the key name.

HOTKEY:
- Use for keyboard combinations.
- Input must use "+" between keys.
- Examples: "CTRL+C", "CTRL+V", "CTRL+S", "ALT+TAB", "CTRL+A".
- Use press_key for a single key.

FOCUS APP:
- Use when the user asks to switch to or focus an application.
- Input must contain only the application name.
- Use before type_text when an application is explicitly specified.

TYPE TEXT:
- Use when the user asks to type or write text.
- Input must contain the exact text requested by the user.
- Do not translate or modify the text.
- If an application is specified, use focus_app first.

OPEN DEFAULT BROWSER:
- Use when the user asks to open the default browser.
- If a website is specified, pass the complete URL.
- If no website is specified, input must be an empty string.
- Do not assume Chrome, Edge, Firefox, Opera, or another browser.
- Do not use open_url after open_default_browser when a URL was already provided.

MOUSE CLICK:
- Use for a mouse click at explicit screen coordinates.
- Input:
{
  "x": 500,
  "y": 300,
  "button": "left"
}
- Supported buttons: left, right.
- Never invent coordinates.
- Coordinates must come from a successful screenshot Vision result.

MOUSE MOVE:
- Use to move the mouse to explicit screen coordinates.
- Input:
{
  "x": 500,
  "y": 300
}
- Never invent coordinates.
- Coordinates must come from a successful screenshot Vision result.

DOUBLE CLICK:
- Use ONLY mouse_double_click when the user explicitly asks for a double click.
- Never use mouse_click before or after mouse_double_click.
- A double click is exactly ONE tool action.
- Input:
{
  "x": 500,
  "y": 300
}
- Never invent coordinates.
- Coordinates must come from a successful screenshot Vision result.

SCROLL:
- Use to scroll the mouse wheel.
- Input must be an integer.
- Positive values scroll up.
- Negative values scroll down.

SCREENSHOT:
- Use when the user asks to take, capture, or inspect a screenshot.
- Input must be an empty string.
- Do not use another tool for screenshots.

VISION:

- Screenshots are analyzed by the vision model.
- The main model does NOT receive image data directly.
- After a successful screenshot, use the provided Vision Analysis and Vision Elements in the history.
- Vision Elements may contain element names and coordinates.
- Never invent visual elements.
- Never invent coordinates.
- Only use coordinates explicitly returned by Vision.
- If a requested UI element is visible but has no coordinates, do NOT guess its coordinates.
- Do not request another screenshot unnecessarily.

CLICKING A VISIBLE ELEMENT:

1. Inspect the latest successful screenshot Vision Elements.
2. Find the requested element by its visible name.
3. If the element has valid explicit coordinates, use mouse_click.
4. If the element does not have coordinates, do not click it.
5. Never infer coordinates from the element's name, position in the list, or general screen layout.

IMPORTANT:

- Never invent coordinates.
- Never convert an element name into guessed coordinates.
- Never use mouse_click, mouse_move, or mouse_double_click using names alone.
- Coordinates must be explicitly available from Vision.
- Use the latest successful screenshot when deciding screen interactions.

FINISH:

- If the successful previous tool result satisfies the user's request, return:
{"action":"finish"}

IMPORTANT:

Previous tool executions have already happened.

Do not repeat a successful action unless another execution is genuinely required.
`;

function buildHistoryContext(history) {
  if (!history.length) {
    return "No tools have been executed yet.";
  }

  return `
Previous tool executions:

${history
  .map(
    (item, index) => `
Step ${index + 1}
Tool: ${item.tool}
Input: ${JSON.stringify(item.input)}
Result: ${JSON.stringify(item.result)}
Vision Analysis: ${JSON.stringify(item.vision || null)}
Vision Elements: ${JSON.stringify(item.visionElements || null)}
Screenshot Size: ${JSON.stringify(item.screenshotSize || null)}
Vision Error: ${JSON.stringify(item.visionError || null)}
Status: ${item.success ? "SUCCESS" : "FAILED"}
`,
  )
  .join("\n")}

These executions have ALREADY happened.

Use their results, Vision Analysis, Vision Elements, and Screenshot Size when deciding the next action.

Do not repeat a successful action unnecessarily.

Never invent coordinates.
`;
}

function buildUserContent(userInput, history) {
  return [
    {
      type: "text",
      text: `${userInput}\n\n${buildHistoryContext(history)}`,
    },
  ];
}

async function analyzeScreenshot(imageBase64, width, height) {
  try {
    if (!imageBase64 || typeof imageBase64 !== "string") {
      throw new Error("Invalid screenshot image data.");
    }

    if (!Number.isInteger(width) || width <= 0) {
      throw new Error("Invalid screenshot width.");
    }

    if (!Number.isInteger(height) || height <= 0) {
      throw new Error("Invalid screenshot height.");
    }

    const response = await client.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "system",
          content: `
Analyze the screenshot.

Screenshot dimensions:
WIDTH: ${width}
HEIGHT: ${height}

Return ONLY valid JSON.

Required format:

{
  "description": "brief description of what is visible",
  "elements": [
    {
      "name": "Save button",
      "x1": 1380,
      "y1": 890,
      "x2": 1480,
      "y2": 930
    }
  ]
}

Rules:

- Only describe what is clearly visible.
- Only include clearly visible interactive UI elements.
- Do not invent elements.
- Do not guess coordinates.
- Coordinates are pixel coordinates relative to this screenshot.
- x1 and x2 define the left and right edges of the clickable element.
- y1 and y2 define the top and bottom edges of the clickable element.
- x1 must be smaller than x2.
- y1 must be smaller than y2.
- All coordinates must be inside the screenshot.
- The bounding box must cover the actual clickable area as accurately as possible.
- Use integer coordinates only.
- If no clearly visible interactive elements exist, return an empty elements array.
- Do not use Markdown.
- Do not use code fences.
- Do not add explanations.
- Do not add text before or after the JSON.
- Do not explain your reasoning.
- Do not think aloud.
- Return ONLY the JSON object.
The final response MUST be only the JSON object.
          `.trim(),
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this screenshot and return ONLY the required JSON.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: VISION_MAX_TOKENS,
      reasoning: {
        effort: "none",
      },
    });

    console.log("🔍 VISION RESPONSE:", JSON.stringify(response, null, 2));

    let result = response?.choices?.[0]?.message?.content;

    if (typeof result !== "string" || !result.trim()) {
      const finishReason = response?.choices?.[0]?.finish_reason || "unknown";

      const nativeFinishReason =
        response?.choices?.[0]?.native_finish_reason || "unknown";

      throw new Error(
        `Vision model returned an empty response. finish_reason=${finishReason}, native_finish_reason=${nativeFinishReason}`,
      );
    }

    result = result.trim();

    console.log("🔍 RAW VISION:", result);

    // Remove accidental Markdown code fences.
    result = result
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;

    try {
      parsed = JSON.parse(result);
    } catch (error) {
      throw new Error(`Vision model returned invalid JSON: ${error.message}`);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Vision result is not a valid object.");
    }

    if (typeof parsed.description !== "string") {
      parsed.description = "";
    }

    if (!Array.isArray(parsed.elements)) {
      parsed.elements = [];
    }

    const validElements = parsed.elements
      .filter((element) => {
        return (
          element &&
          typeof element.name === "string" &&
          element.name.trim() &&
          Number.isInteger(element.x1) &&
          Number.isInteger(element.y1) &&
          Number.isInteger(element.x2) &&
          Number.isInteger(element.y2) &&
          element.x1 >= 0 &&
          element.y1 >= 0 &&
          element.x2 >= element.x1 &&
          element.y2 >= element.y1 &&
          element.x2 < width &&
          element.y2 < height
        );
      })
      .map((element) => ({
        name: element.name.trim(),
        x1: element.x1,
        y1: element.y1,
        x2: element.x2,
        y2: element.y2,
      }));

    const normalizedResult = {
      description: parsed.description.trim(),
      elements: validElements,
    };

    console.log("🧩 VISION ELEMENTS:", normalizedResult.elements);

    return JSON.stringify(normalizedResult);
  } catch (error) {
    console.error("❌ Vision analysis error:", error.message);

    throw new Error(error.message || "Failed to analyze screenshot.");
  }
}

function parseScreenElements(visionText) {
  if (typeof visionText !== "string" || !visionText.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(visionText);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.elements)
    ) {
      return [];
    }

    return parsed.elements
      .filter((element) => {
        return (
          element &&
          typeof element.name === "string" &&
          element.name.trim() &&
          Number.isFinite(element.x1) &&
          Number.isFinite(element.y1) &&
          Number.isFinite(element.x2) &&
          Number.isFinite(element.y2) &&
          element.x1 >= 0 &&
          element.y1 >= 0 &&
          element.x2 >= element.x1 &&
          element.y2 >= element.y1
        );
      })
      .map((element) => ({
        name: element.name.trim(),
        x1: Math.round(element.x1),
        y1: Math.round(element.y1),
        x2: Math.round(element.x2),
        y2: Math.round(element.y2),
        x: Math.round((element.x1 + element.x2) / 2),
        y: Math.round((element.y1 + element.y2) / 2),
      }))
      .filter((element) => element.name);
  } catch (error) {
    console.error("Vision JSON parse error:", error.message);

    return [];
  }
}

async function askAgentForNextAction(userInput, history) {
  const response = await client.chat.completions.create(
    {
      model: MODEL,
      max_tokens: AGENT_MAX_TOKENS,
      messages: [
        {
          role: "system",
          content: AGENT_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildUserContent(userInput, history),
        },
      ],
    },
    {
      timeout: REQUEST_TIMEOUT,
    },
  );

  const content = response?.choices?.[0]?.message?.content;
  console.log("🧠 AGENT RAW RESPONSE:", JSON.stringify(response, null, 2));
  if (!content || typeof content !== "string" || !content.trim()) {
    throw new Error("Agent returned an empty response.");
  }

  return content.trim();
}

function cleanJsonResponse(rawAction) {
  if (typeof rawAction !== "string") {
    return "";
  }

  let cleaned = rawAction.trim();

  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  return cleaned;
}

function parseAgentAction(rawAction) {
  const cleaned = cleanJsonResponse(rawAction);

  if (!cleaned) {
    return {
      valid: false,
      error: "Agent returned an empty response.",
    };
  }

  let action;

  try {
    action = JSON.parse(cleaned);
  } catch {
    return {
      valid: false,
      error: "Agent returned invalid JSON.",
    };
  }

  if (!action || typeof action !== "object" || Array.isArray(action)) {
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

  if (!TOOL_NAMES.includes(action.tool)) {
    return {
      valid: false,
      error: `Unknown tool: ${action.tool}`,
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

function createHistoryItem(step, action, toolResult) {
  const item = {
    step,
    tool: action.tool,
    input: action.input,
    success: Boolean(toolResult.success),
    result: toolResult.success
      ? toolResult.result
      : `ERROR: ${toolResult.error}`,
  };

  if (
    action.tool === "screenshot" &&
    toolResult.success &&
    typeof toolResult.vision === "string" &&
    toolResult.vision.trim()
  ) {
    item.vision = toolResult.vision;
  }

  if (
    action.tool === "screenshot" &&
    toolResult.success &&
    Array.isArray(toolResult.visionElements)
  ) {
    item.visionElements = toolResult.visionElements;

    if (item.visionElements.length > 0) {
      console.log("🧩 VISION ELEMENTS:", item.visionElements);
    }
  }

  if (
    action.tool === "screenshot" &&
    toolResult.success &&
    Number.isInteger(toolResult.width) &&
    Number.isInteger(toolResult.height)
  ) {
    item.screenshotSize = {
      width: toolResult.width,
      height: toolResult.height,
    };

    console.log(
      "🖥️ SCREENSHOT SIZE:",
      `${toolResult.width}x${toolResult.height}`,
    );
  }

  if (action.tool === "screenshot" && toolResult.visionError) {
    item.visionError = toolResult.visionError;
  }

  return item;
}

async function runAgent(userInput) {
  const history = [];

  if (typeof userInput !== "string" || !userInput.trim()) {
    return {
      success: false,
      error: "Invalid user input.",
      history,
    };
  }

  const cleanInput = userInput.trim();

  for (let step = 1; step <= MAX_STEPS; step++) {
    const parsed = await getNextActionWithRetry(cleanInput, history);

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

    console.log(
      `🤖 Agent Action → ${action.tool}: ${JSON.stringify(action.input)}`,
    );

    let toolResult;

    try {
      toolResult = await executeTool(action.tool, action.input);

      /*
       * SCREENSHOT + VISION
       */
      if (
        action.tool === "screenshot" &&
        toolResult?.success &&
        typeof toolResult.image === "string" &&
        toolResult.image.length > 0
      ) {
        let visionResult = null;
        let visionElements = [];
        let visionError = null;

        const width = Number.isInteger(toolResult.width)
          ? toolResult.width
          : null;

        const height = Number.isInteger(toolResult.height)
          ? toolResult.height
          : null;

        try {
          if (!width || !height) {
            throw new Error("Screenshot dimensions are unavailable.");
          }

          visionResult = await analyzeScreenshot(
            toolResult.image,
            width,
            height,
          );

          visionElements = parseScreenElements(visionResult);
        } catch (error) {
          visionError = error?.message || "Vision analysis failed.";
        }

        const visionSucceeded = Boolean(visionResult && !visionError);

        toolResult = {
          success: true,

          result: visionSucceeded
            ? "Screenshot captured and analyzed."
            : "Screenshot captured, but Vision analysis failed.",

          image: toolResult.image,

          mimeType: toolResult.mimeType || "image/png",

          width,
          height,

          vision: visionResult,

          visionElements,

          visionError,
        };
      }
    } catch (error) {
      toolResult = {
        success: false,
        error: error?.message || "Tool execution failed.",
      };
    }

    const historyItem = createHistoryItem(step, action, toolResult);

    history.push(historyItem);

    if (!toolResult.success) {
      return {
        success: false,
        error: toolResult.error || "Tool execution failed.",
        history,
      };
    }
  }

  return {
    success: false,
    error: `Agent reached maximum number of steps (${MAX_STEPS}).`,
    history,
  };
}

module.exports = {
  runAgent,
};
