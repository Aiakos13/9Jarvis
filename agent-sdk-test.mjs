import "dotenv/config";

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { z } from "zod";

const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: "ollama",
});

const agent = new ToolLoopAgent({
  model: ollama(process.env.OLLAMA_MODEL || "qwen3:4b-fast"),
  instructions: `
You are a fast tool-using assistant.
Use the calculator whenever a mathematical calculation is requested.
After receiving the calculator result, answer briefly in Persian.
Do not repeat a completed calculation.
`,
  providerOptions: {
    ollama: {
      reasoningEffort: "none",
    },
  },
  tools: {
    calculator: tool({
      description: "Calculate a mathematical expression.",
      inputSchema: z.object({
        expression: z.string(),
      }),
      execute: async ({ expression }) => {
        const normalized = expression.replace(/\s/g, "");

        if (!/^[\d+\-*/().%]+$/.test(normalized)) {
          throw new Error("Invalid mathematical expression");
        }

        const result = Function(`"use strict"; return (${normalized})`)();

        if (!Number.isFinite(result)) {
          throw new Error("Invalid calculation result");
        }

        console.log("CALCULATOR RESULT:", result);

        return { result };
      },
    }),
  },
  stopWhen: stepCountIs(3),
});

const startedAt = Date.now();

try {
  const result = await agent.generate({
    prompt: "با ماشین حساب 125 * 8 + 340 را محاسبه کن",
    timeout: 240000,
  });

  console.log("\nFINAL RESPONSE:", result.text);
  console.log("STEPS:", result.steps.length);
  console.log(
    "TOTAL TIME:",
    ((Date.now() - startedAt) / 1000).toFixed(2),
    "seconds",
  );

  for (const [index, step] of result.steps.entries()) {
    console.log(`STEP ${index + 1}:`, {
      finishReason: step.finishReason,
      inputTokens: step.usage?.inputTokens,
      outputTokens: step.usage?.outputTokens,
    });
  }
} catch (error) {
  console.error("AGENT ERROR:", error);
  process.exitCode = 1;
}
