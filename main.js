const readline = require("readline");
const OpenAI = require("openai");

const config = require("./config");
const {
  calculator,
  getCurrentTime,
  getCurrentDate,
  getRandomNumber,
} = require("./tools");

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
    max_tokens: 3000,
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
- Prioritize recent information when the user asks for the latest news.
- Check publication dates when available.
- Do not treat old articles as recent news.
- Distinguish publication dates from event dates.
- If a publication date is unavailable, do not invent one.
- Select distinct news stories instead of repeating the same story from multiple sources.
- Summarize each story using only information supported by its search result.
- Include the source title and URL for each news item when available.
- If search results do not contain enough information, clearly state the limitation.
- Do not present assumptions or unverified claims as confirmed facts.
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
  console.log(
    "FINAL RESPONSE DEBUG:",
    JSON.stringify(
      {
        finish_reason: response?.choices?.[0]?.finish_reason,
        message: response?.choices?.[0]?.message,
        usage: response?.usage,
      },
      null,
      2,
    ),
  );
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
    // Direct Calculator
    // ========================================

    const calculatorMatch =
      cleanInput.match(
        /ماشین\s*حساب\s+([0-9+\-*/%().\s]+?)(?=\s*(?:را\s*)?(?:محاسبه\s*کن|حساب\s*کن)|$)/i,
      ) ||
      (/^[\d\s()+\-*/%.]+$/.test(cleanInput) &&
      /[\d)]\s*[+\-*/%]\s*[\d(]/.test(cleanInput)
        ? [cleanInput, cleanInput]
        : null);

    if (calculatorMatch) {
      const result = calculator(calculatorMatch[1]);

      if (result.success) {
        console.log(`9Jarvis: ${result.result}`);
      } else {
        console.log(`9Jarvis: خطا در محاسبه: ${result.error}`);
      }

      return;
    }

    if (calculatorMatch) {
      const result = calculator(calculatorMatch[1]);

      if (result.success) {
        console.log(`9Jarvis: ${result.result}`);
      } else {
        console.log(`9Jarvis: خطا در محاسبه: ${result.error}`);
      }

      return;
    }
    // ========================================
    // Direct Time, Date and Random
    // ========================================

    if (
      /(?:الان\s*ساعت|ساعت\s*چنده|ساعت\s*چند\s*است|وقت\s*فعلی)/i.test(
        cleanInput,
      )
    ) {
      const result = getCurrentTime();

      console.log(`9Jarvis: ساعت ${result.result}`);
      return;
    }

    if (
      /(?:تاریخ\s*(?:امروز|فعلی)|امروز\s*چندمه|امروز\s*چندم|امروز\s*چه\s*روزی)/i.test(
        cleanInput,
      )
    ) {
      const result = getCurrentDate();

      console.log(`9Jarvis: تاریخ ${result.result}`);
      return;
    }

    if (
      /(?:عدد\s*(?:تصادفی|رندوم)|(?:یه|یک)\s*عدد\s*(?:تصادفی|رندوم))/i.test(
        cleanInput,
      )
    ) {
      const result = getRandomNumber();

      console.log(`9Jarvis: ${result.result}`);
      return;
    }
    // ========================================
    // ========================================
    // 1 & 2. Detect and retrieve memory in parallel
    // ========================================

    const [memoryDetection, memoryQueryDetection] =
      await Promise.allSettled([
        detectMemory(cleanInput),
        detectMemoryQuery(cleanInput),
      ]);

    // 1. Save detected memory

    if (memoryDetection.status === "fulfilled") {
      let memoryData;

      try {
        memoryData = JSON.parse(memoryDetection.value);
      } catch {
        memoryData = { shouldRemember: false };
      }

      if (memoryData.shouldRemember) {
        try {
          saveDetectedMemory(
            memoryData.category,
            memoryData.key,
            memoryData.value,
            memoryData.multiple,
          );

          console.log(`Memory saved -> ${memoryData.key}`);
        } catch (error) {
          console.log(`Memory save skipped: ${error.message}`);
        }
      }
    } else {
      console.log(
        `Memory detection skipped: ${memoryDetection.reason.message}`,
      );
    }

    // 2. Retrieve relevant memory

    let memoryContext = {};

    if (memoryQueryDetection.status === "fulfilled") {
      let memoryQueryData;

      try {
        memoryQueryData = JSON.parse(memoryQueryDetection.value);
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
        try {
          memoryContext = buildMemoryContext(memoryQueryData.memories);
        } catch (error) {
          console.log(`Memory retrieval skipped: ${error.message}`);
        }
      }
    } else {
      console.log(
        `Memory retrieval skipped: ${memoryQueryDetection.reason.message}`,
      );
    }

    // ========================================
    // 3. Run Agent
    // ========================================

    const agentResult = await runAgent(cleanInput);

    if (!agentResult.success) {
      console.log(`⚠️ Agent error: ${agentResult.error}`);
      console.log(
        `9Jarvis: نتونستم درخواستت رو کامل کنم. خطا: ${agentResult.error}`,
      );
      return;
    }

    const agentHistory = Array.isArray(agentResult.history)
      ? agentResult.history
      : [];
    // ========================================
    // 4. Direct response for simple tools
    // ========================================

    const simpleTools = ["calculator", "time", "date", "random"];

    const lastHistoryItem = agentHistory.at(-1);

    if (
      agentHistory.length === 1 &&
      lastHistoryItem?.success &&
      simpleTools.includes(lastHistoryItem.tool)
    ) {
      console.log(`9Jarvis: ${lastHistoryItem.result}`);
      return;
    }
    // ========================================
    // 5. Generate final response
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
// 6.CLI
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
