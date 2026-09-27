const readline = require("readline");
const OpenAI = require("openai");

const config = require("./config");

const { saveDetectedMemory, getMemoryContext } = require("./memory");

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
    (item, index) =>
      `Step ${index + 1}
Tool: ${item.tool}
Input: ${item.input || ""}
Success: ${item.success}
Result: ${item.result}`,
  )
  .join("\n\n")}
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

Important:
- Use saved memory when relevant.
- If the user asks for their name and memory contains:
"user": {
  "name": "Sina"
}
then answer that the user's name is Sina.
- If a successful tool result exists, use it as the authoritative result.
- Do not invent information.
- Do not mention internal Agent steps.
`,
      },
    ],
  });

  const content = response?.choices?.[0]?.message?.content;

  if (!content || typeof content !== "string") {
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
      const memoryResult = await saveDetectedMemory(cleanInput);

      if (memoryResult?.saved) {
        console.log(`🧠 Memory saved → ${memoryResult.key}`);
      }
    } catch (error) {
      console.log(`⚠️ Memory saving skipped: ${error.message}`);
    }

    // ========================================
    // 2. Load current memory
    // ========================================

    let memoryContext = {};

    try {
      memoryContext = getMemoryContext();
    } catch (error) {
      console.log(`⚠️ Memory loading skipped: ${error.message}`);
    }

    // ========================================
    // 3. Run Agent
    // ========================================

    const agentResult = await runAgent(cleanInput);

    if (!agentResult.success) {
      console.log(`⚠️ Agent error: ${agentResult.error}`);
    }

    const agentHistory =
      agentResult.success && Array.isArray(agentResult.history)
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
