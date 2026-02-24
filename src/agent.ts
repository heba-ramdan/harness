import { appendFile, mkdir, readFile } from "node:fs/promises";
import { type Options, type Query, query } from "@anthropic-ai/claude-agent-sdk";
import type { AgentContext } from "./agent-context.js";
import { createAgentRegistry } from "./agents/index.js";
import type { HarnessConfig } from "./config.js";
import { loadIdentity } from "./prompt.js";
import { createAgentServers } from "./tools/index.js";

async function loadMemoryContext(contextFile: string): Promise<string | null> {
  try {
    const content = await readFile(contextFile, "utf-8");
    return content.trim() || null;
  } catch {
    return null;
  }
}

export function buildOptions(
  ctx: AgentContext,
  opts: { resume?: string; systemPrompt: string },
  config: HarnessConfig,
): Options {
  return {
    model: config.model,
    systemPrompt: opts.systemPrompt,
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    tools: [],
    thinking: { type: "adaptive" },
    effort: "high",
    includePartialMessages: true,
    stderr: async (data: string) => {
      await mkdir(ctx.stateDir, { recursive: true });
      await appendFile(ctx.stderrLog, `${new Date().toISOString()} ${data}\n`);
    },
    mcpServers: createAgentServers(ctx, config),
    strictMcpConfig: true,
    agents: createAgentRegistry(ctx.name),
    ...(opts.resume ? { resume: opts.resume } : {}),
  };
}

export async function buildSystemPrompt(ctx: AgentContext): Promise<string> {
  const identity = await loadIdentity(ctx.identityPath);
  const memoryContext = await loadMemoryContext(ctx.contextFile);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const dateLine = `# Current Date\n\n${date}, ${time} (${tz})`;

  const parts = [identity];
  if (memoryContext) {
    parts.push(
      `# Persistent Memory\n\nThe following is your accumulated context from previous sessions:\n\n${memoryContext}`,
    );
  }
  parts.push(dateLine);

  return parts.join("\n\n");
}

export function sendMessage(prompt: string, options: Options): Query {
  return query({ prompt, options });
}
