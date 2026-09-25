const OpenAI = require("openai");
const config = require("./config");

const client = new OpenAI({
  apiKey: config.openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

async function detectTool(text) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `
You are the tool detector for 9Jarvis.

Determine whether the user's request requires a tool.

Available tools:
- calculator
- time
- date
- random

If the request requires calculator, return ONLY valid JSON:

{
  "needsTool": true,
  "tool": "calculator",
  "input": "..."
}

If the request asks for the current time, return:

{
  "needsTool": true,
  "tool": "time",
  "input": null
}

If the request asks for today's date, return:

{
  "needsTool": true,
  "tool": "date",
  "input": null
}

If the user asks for a random number, return:

{
  "needsTool": true,
  "tool": "random",
  "input": null
}

If no tool is needed, return:

{
  "needsTool": false,
  "tool": null,
  "input": null
}

Rules:
- Return ONLY valid JSON.
- Never invent a tool.
- Use "calculator" only for mathematical calculations.
- Put the mathematical expression in "input".
- Use "time" only for the current time.
- Use "date" only for today's date.
- Use "random" only when the user asks for a random number.
- Do not answer the user's question.
        `,
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return response.choices[0].message.content;
}

module.exports = {
  detectTool,
};
