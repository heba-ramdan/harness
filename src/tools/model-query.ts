import { query, tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const MODEL_ALIASES: Record<string, string> = {
  haiku: "claude-haiku-4-5",
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-6",
};

function resolveModel(input: string): string {
  return MODEL_ALIASES[input.toLowerCase()] ?? input;
}

type ThinkingLevel = "disabled" | "low" | "medium" | "high" | "max";

const THINKING_BUDGETS: Record<Exclude<ThinkingLevel, "disabled">, number> = {
  low: 1024,
  medium: 4096,
  high: 16384,
  max: 32768,
};

function buildThinkingConfig(level: ThinkingLevel): { type: "enabled"; budget_tokens: number } | { type: "disabled" } {
  if (level === "disabled") return { type: "disabled" };
  return { type: "enabled", budget_tokens: THINKING_BUDGETS[level] };
}

function extractTextFromContent(content: any[]): { text: string; thinkingTokenEstimate: number } {
  const textParts: string[] = [];
  let thinkingChars = 0;

  for (const block of content) {
    if (block.type === "text") {
      textParts.push(block.text);
    } else if (block.type === "thinking" && block.thinking) {
      thinkingChars += block.thinking.length;
    }
  }

  // Rough estimate: ~4 chars per token for thinking
  return { text: textParts.join(""), thinkingTokenEstimate: Math.round(thinkingChars / 4) };
}

function formatUsage(inputTokens: number, outputTokens: number, thinkingTokens?: number): string {
  let s = `${inputTokens} in / ${outputTokens} out`;
  if (thinkingTokens && thinkingTokens > 0) s += ` (${thinkingTokens} thinking)`;
  return s;
}

async function queryModel(opts: {
  model: string;
  systemPrompt?: string;
  message: string;
  maxTokens: number;
  thinking: ThinkingLevel;
}): Promise<{ text: string; usage: string }> {
  let responseText = "";
  let usageInfo = "";
  const thinkingConfig = buildThinkingConfig(opts.thinking);

  for await (const msg of query({
    prompt: opts.message,
    options: {
      model: opts.model,
      systemPrompt: opts.systemPrompt ?? "You are a helpful assistant.",
      tools: [],
      mcpServers: {},
      maxTurns: 1,
      persistSession: false,
      thinking: thinkingConfig,
    },
  })) {
    if (msg.type === "assistant") {
      // SDKAssistantMessage.message is a BetaMessage with .content array
      const content = (msg as any).message?.content;
      if (Array.isArray(content)) {
        const extracted = extractTextFromContent(content);
        if (extracted.text) responseText = extracted.text;
      }
      const u = (msg as any).message?.usage;
      if (u) {
        usageInfo = formatUsage(u.input_tokens ?? 0, u.output_tokens ?? 0);
      }
    }
    if (msg.type === "result") {
      // SDKResultSuccess has .result (string) and .modelUsage
      if (!responseText) {
        responseText = (msg as any).result ?? "";
      }
      // Prefer modelUsage from result for accurate totals
      const mu = (msg as any).modelUsage as Record<string, { inputTokens?: number; outputTokens?: number }> | undefined;
      if (mu) {
        let totalIn = 0;
        let totalOut = 0;
        for (const m of Object.values(mu)) {
          totalIn += m.inputTokens ?? 0;
          totalOut += m.outputTokens ?? 0;
        }
        usageInfo = formatUsage(totalIn, totalOut);
      }
    }
  }

  return { text: responseText || "(no response)", usage: usageInfo || "unknown" };
}

const modelQuery = tool(
  "model_query",
  'Send a query to a specified Claude model with a custom system prompt. Returns the model\'s text response. Use for evaluations, comparisons, testing across models. Accepts model aliases: "haiku", "sonnet", "opus".',
  {
    model: z.string().describe('Model ID or alias: "haiku", "sonnet", "opus", or full ID like "claude-haiku-4-5"'),
    message: z.string().describe("The user message to send"),
    system_prompt: z.string().optional().describe("System prompt for this query"),
    max_tokens: z.number().optional().describe("Maximum response tokens. Default: 4096"),
    thinking: z
      .enum(["disabled", "low", "medium", "high", "max"])
      .optional()
      .describe(
        "Thinking effort level. Default: 'disabled'. Low=1024, medium=4096, high=16384, max=32768 budget tokens.",
      ),
  },
  async ({ model, message, system_prompt, max_tokens, thinking }) => {
    const resolvedModel = resolveModel(model);
    const maxTokens = max_tokens ?? 4096;
    const thinkingLevel: ThinkingLevel = thinking ?? "disabled";

    try {
      const { text, usage } = await queryModel({
        model: resolvedModel,
        systemPrompt: system_prompt,
        message,
        maxTokens,
        thinking: thinkingLevel,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `[${resolvedModel}] (${usage})\n\n${text}`,
          },
        ],
      };
    } catch (err: unknown) {
      const e = err as { message: string };
      return {
        content: [{ type: "text" as const, text: `Error: ${e.message}` }],
      };
    }
  },
);

export const modelQueryTools = [modelQuery];
