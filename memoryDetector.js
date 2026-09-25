
const OpenAI = require("openai");
const config = require("./config");

const client = new OpenAI({
  apiKey: config.openRouterApiKey,
  baseURL: "https://openrouter.ai/api/v1",
});

async function detectMemory(text) {
  const response = await client.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `
You are the memory detector for 9Jarvis.

Decide whether the user's message contains information worth remembering for future conversations.

Return ONLY valid JSON.

For a single-value memory, use:
{
  "shouldRemember": true,
  "category": "identity",
  "key": "name",
  "value": "Sina",
  "multiple": false
}

For a multi-value memory, use:
{
  "shouldRemember": true,
  "category": "preference",
  "key": "programming_languages",
  "value": "Python",
  "multiple": true
}

If the message is not worth remembering, use:
{
  "shouldRemember": false
}

Rules:
- shouldRemember must be true or false.
- category can be: identity, preference, project, goal, fact, or other.
- key must be short, descriptive, and use snake_case.
- value must contain only the useful information.
- multiple must be true when the user can naturally have multiple values for the same memory.
- Examples of multi-value memories: programming languages, favorite games, favorite music, hobbies, technologies, interests.
- Examples of single-value memories: name, age, current project name.
- Do not explain anything outside the JSON.
- Use the same key for the same type of memory across different messages.
- Prefer canonical keys when applicable.
- For programming languages, always use: "programming_languages".
- For hobbies, always use: "hobbies".
- For favorite games, always use: "favorite_games".
- For favorite music, always use: "favorite_music".
- For technologies, always use: "technologies".
- Do not create alternative keys such as "favorite_programming_languages" when "programming_languages" already represents the same type of memory.
- If the key is "programming_languages", "hobbies", "favorite_games", "favorite_music", or "technologies", multiple MUST be true.
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
  detectMemory,
};