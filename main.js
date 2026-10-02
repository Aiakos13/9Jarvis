const readline = require("readline");
const OpenAI = require("openai");

const config = require("./config");

const { saveDetectedMemory, buildMemoryContext } = require("./memory");

const { detectMemoryQuery } = require("./memoryQueryDetector");
const { detectMemory } = require("./memoryDetector");

const { runAgent } = require("./agent");

const client = new OpenAI({
  apiKey: config.openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

const SYSTEM_PROMPT = `
You are 9Jarvis, a personal AI assistant.

Identity:
- Your name is 9Jarvis.
- Do not identify yourself as ChatGPT unless explicitly asked about the underlying model.
- When the user speaks Persian, respond in Persian.

Memory:
- You will receive the current saved memory of the user.
- Use the memory when it is relevant to the user's request.
- Never invent memories.
- If the memory contains the answer, use it directly.
- If the memory does not contain the answer, say that you do not know instead of inventing information.

Tools and Agent:
- The Agent may execute tools before the final response.
- Tool results are real data produced by 9Jarvis.
- Treat successful tool results as authoritative.
- Never ignore a successful tool result.
- Never invent a different value from a tool result.
- Vision Analysis from a successful screenshot is also authoritative for visible screen content.
- Do not explain internal Agent steps unless the user asks.

Response style:
- Be natural and concise.
- When the user speaks Persian, answer in Persian.
- Use simple conversational language.
`;

async function generateFinalResponse(userInput, memoryContext, agentHistory) {
  const memoryText = JSON.stringify(memoryContext, null, 2);

  const toolContext = agentHistory.length
    ? `
Tool execution history:

${agentHistory
  .map(
    (item, index) => `
Step ${index + 1}
Tool: ${item.tool}
Input: ${JSON.stringify(item.input)}
Success: ${item.success}
Result: ${JSON.stringify(item.result)}
Vision Analysis: ${JSON.stringify(item.vision || null)}
Vision Error: ${JSON.stringify(item.visionError || null)}
`,
  )
  .join("\n")}
`
    : "No tools were executed.";

  const response = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `
User request:
${userInput}

Saved memory:
${memoryText}

${toolContext}

Now answer the user naturally.

IMPORTANT RULES:

MEMORY:
- Use saved memory when it is relevant.
- Never invent a memory.
- If the requested information exists in memory, use it directly.
- If the requested information does not exist in memory, say that you do not know.

TOOL RESULTS:
- Tool execution history contains real results produced by 9Jarvis.
- A tool result with "Success: true" is authoritative.
- If a successful tool result is relevant to the user's request, you MUST use it.
- NEVER ignore a successful tool result.
- NEVER replace a successful tool result with a different value.
- NEVER say that the information could not be retrieved when a successful result exists.
- NEVER invent information that is not present in the tool result.
- Do not mention internal Agent steps, tool execution history, or implementation details.

SCREENSHOT / VISION:
- A successful screenshot may contain a "Vision Analysis" field.
- Vision Analysis is the actual description of the screenshot produced by the vision model.
- If the user asks what is visible on the screen, you MUST use the Vision Analysis.
- Treat successful Vision Analysis as authoritative for visible screen content.
- Do not say that the screen could not be viewed when a successful Vision Analysis exists.
- Do not say that screenshot information is unavailable when a successful Vision Analysis exists.
- Do not invent visual details that are not present in Vision Analysis.
- Answer naturally based on the Vision Analysis.
- Do not mention the vision model, screenshot processing, Agent, or internal implementation unless the user explicitly asks.

CALCULATOR:
- Use the exact result returned by the calculator.

TIME:
- Use the exact time returned by the time tool.

DATE:
- Use the exact date returned by the date tool.

RANDOM:
- Use the exact number returned by the random tool.

WEATHER:
- Use the actual values returned by the weather tool.
- Do not invent weather conditions that are not present in the result.
- Do not invent temperature, humidity, wind speed, sky condition, or air quality.

WEB SEARCH:
- Use information from the successful search result.
- Do not claim that the search failed if results were returned.
- Do not invent facts that are not supported by the search results.

CURRENCY:
- Use the exact "rate" returned by the successful currency tool.
- Clearly state the source currency, target currency, rate, and date when available.
- If the result is:
  {
    "from": "USD",
    "to": "EUR",
    "rate": 0.88,
    "date": "2026-09-29"
  }
  then explain it as:
  "هر ۱ دلار آمریکا حدود ۰.۸۸ یورو است."
- Do not say that the exchange rate could not be retrieved when a successful currency result exists.
- Do not invent a different exchange rate.
- If the user asks for an amount, calculate it from the returned rate only when the amount is explicitly available.

RESPONSE STYLE:
- Be concise and natural.
- Answer directly.
- When the user speaks Persian, respond in Persian.
- Do not explain internal processing.
`,
      },
    ],
  });

  const content = response?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string" || !content.trim()) {
    throw new Error("Final response was empty.");
  }

  return content.trim();
}

async function askUser(userInput) {
  try {
    if (!userInput || typeof userInput !== "string") {
      return;
    }

    const cleanInput = userInput.trim();

    if (!cleanInput) {
      return;
    }

    // ========================================
    // 1. Detect and save memory
    // ========================================

    try {
      const detectedMemory = await detectMemory(cleanInput);

      let memoryData;

      try {
        memoryData = JSON.parse(detectedMemory);
      } catch {
        memoryData = {
          shouldRemember: false,
        };
      }

      if (memoryData.shouldRemember) {
        const memoryResult = saveDetectedMemory(
          memoryData.category,
          memoryData.key,
          memoryData.value,
          memoryData.multiple,
        );

        console.log(`🧠 Memory saved → ${memoryData.key}`);
      }
    } catch (error) {
      console.log(`⚠️ Memory detection skipped: ${error.message}`);
    }

    // ========================================
    // 2. Retrieve relevant memory
    // ========================================

    let memoryContext = {};

    try {
      const detectedQuery = await detectMemoryQuery(cleanInput);

      let memoryQueryData;

      try {
        memoryQueryData = JSON.parse(detectedQuery);
      } catch {
        memoryQueryData = {
          needsMemory: false,
          memories: [],
        };
      }

      if (
        memoryQueryData.needsMemory &&
        Array.isArray(memoryQueryData.memories)
      ) {
        memoryContext = buildMemoryContext(memoryQueryData.memories);
      }
    } catch (error) {
      console.log(`⚠️ Memory retrieval skipped: ${error.message}`);
    }

    // ========================================
    // 3. Run Agent
    // ========================================

    const agentResult = await runAgent(cleanInput);

    if (!agentResult.success) {
      console.log(`⚠️ Agent error: ${agentResult.error}`);
    }

    const agentHistory = Array.isArray(agentResult.history)
      ? agentResult.history
      : [];

    // ========================================
    // 4. Generate final response
    // ========================================

    const finalResponse = await generateFinalResponse(
      cleanInput,
      memoryContext,
      agentHistory,
    );

    console.log(`9Jarvis: ${finalResponse}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// ========================================
// CLI
// ========================================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🤖 9Jarvis is ready.");
console.log("💬 Type your message. Type 'exit' to quit.\n");

function startChat() {
  rl.question("You: ", async (input) => {
    if (input.trim().toLowerCase() === "exit") {
      console.log("\n👋 خداحافظ !");
      rl.close();
      return;
    }

    await askUser(input);

    console.log();
    startChat();
  });
}

startChat();
