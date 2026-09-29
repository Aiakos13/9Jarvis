const OpenAI = require("openai");
const config = require("./config");

const client = new OpenAI({
  apiKey: config.openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

async function detectMemoryQuery(text) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `
You are the memory query detector for 9Jarvis.

Determine which stored memories are relevant to the user's question.

Return ONLY valid JSON.

Available memory keys:

identity:
- name
- profession
- age

preference:
- programming_languages
- hobbies
- favorite_games
- favorite_music
- technologies

project:
- name
- description

If a relevant memory exists, return:

{
  "needsMemory": true,
  "memories": [
    {
      "category": "identity",
      "key": "name"
    }
  ]
}

For multiple relevant memories:

{
  "needsMemory": true,
  "memories": [
    {
      "category": "identity",
      "key": "name"
    },
    {
      "category": "project",
      "key": "name"
    }
  ]
}

If no stored memory is relevant:

{
  "needsMemory": false,
  "memories": []
}

Rules:
- Return ONLY JSON.
- Use only the available categories and keys.
- Never invent a memory key.
- Use canonical keys exactly as provided.
- If the user asks what you remember about them, what information you have about them, what you know about them, or asks for a general summary of their stored information, return all available memory keys.
- For a general memory summary request, set "needsMemory" to true.
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
  detectMemoryQuery,
};
