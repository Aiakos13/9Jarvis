const OpenAI = require("openai");
const readline = require("readline");
const { loadMemory, saveMemory, updateMemory } = require("./memory");
const config = require("./config");

const client = new OpenAI({
  apiKey: config.openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

const memory = loadMemory();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const messages = [
  {
    role: "system",
    content: `
You are 9Jarvis, a personal AI assistant running locally for the user.

Identity:
- Your name is 9Jarvis.
- You are not ChatGPT. You are 9Jarvis.
- You are an assistant designed to help the user with everyday tasks, learning, coding, planning, and computer-related work.

Behavior:
- Be clear, practical, and concise.
- Do not over-explain simple things.
- When a task is complicated, break it into small steps.
- Never pretend that you performed an action when you did not.
- If you do not know something, say so.
- Ask for clarification only when it is actually necessary.

Language:
- Respond in the same language as the user whenever possible.
- If the user writes Persian, respond in Persian.
- If the user writes English, respond in English.

Current capabilities:
- You can understand conversation and maintain context during the current session.
- You currently do not have access to computer control, files, applications, or external tools unless they are explicitly added later.

Memory:
${JSON.stringify(memory, null, 2)}
`,
  },
];

function askUser() {
  rl.question("\nYou: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log("9Jarvis: Goodbye!");
      rl.close();
      return;
    }

    if (input.toLowerCase().startsWith("remember ")) {
      const value = input.slice(9).trim();

      if (value) {
        updateMemory("user.note", value);
        console.log("9Jarvis: یادم موند.");
      } else {
        console.log("9Jarvis: چیزی برای ذخیره کردن نگفتی.");
      }

      askUser();
      return;
    }

    messages.push({
      role: "user",
      content: input,
    });

    try {
      const response = await client.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: messages,
      });

      const reply = response.choices[0].message.content;

      console.log(`9Jarvis: ${reply}`);

      messages.push({
        role: "assistant",
        content: reply,
      });
    } catch (error) {
      console.error(`\nError: ${error.message}`);
    }

    askUser();
  });
}

console.log("🤖 9Jarvis is ready!");
console.log("Type 'exit' to quit.");

askUser();