import { appendFile, mkdir, readFile } from "node:fs/promises";
import {
  type CanUseTool,
  type HookCallbackMatcher,
  type HookEvent,
  type Options,
  type Query,
  query,
} from "@anthropic-ai/claude-agent-sdk";
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

function buildHooks(
  ctx: AgentContext,
  config: HarnessConfig,
  onInstructionsLoaded?: (filePath: string, memoryType: string, loadReason: string) => void,
): Partial<Record<HookEvent, HookCallbackMatcher[]>> | undefined {
  const hooks: Partial<Record<HookEvent, HookCallbackMatcher[]>> = {};

  if (config.hooks.logToolUse) {
    const logDir = ctx.stateDir;
    const logPath = ctx.stderrLog;

    hooks.PreToolUse = [
      {
        hooks: [
          async (input) => {
            if (input.hook_event_name === "PreToolUse") {
              const ts = new Date().toISOString();
              const toolName = input.tool_name;
              const toolInput =
                typeof input.tool_input === "string"
                  ? input.tool_input.slice(0, 200)
                  : JSON.stringify(input.tool_input).slice(0, 200);
              await mkdir(logDir, { recursive: true });
              await appendFile(logPath, `${ts} [hook:PreToolUse] ${toolName} ${toolInput}\n`);
            }
            return { continue: true };
          },
        ],
      },
    ];

    hooks.PostToolUse = [
      {
        hooks: [
          async (input) => {
            if (input.hook_event_name === "PostToolUse") {
              const ts = new Date().toISOString();
              const toolName = input.tool_name;
              await mkdir(logDir, { recursive: true });
              await appendFile(logPath, `${ts} [hook:PostToolUse] ${toolName} complete\n`);
            }
            return { continue: true };
          },
        ],
      },
    ];
  }

  hooks.InstructionsLoaded = [
    {
      hooks: [
        async (input) => {
          if (input.hook_event_name === "InstructionsLoaded") {
            const { file_path, memory_type, load_reason } = input;
            onInstructionsLoaded?.(file_path, memory_type, load_reason);
          }
          return { continue: true };
        },
      ],
    },
  ];

  return Object.keys(hooks).length > 0 ? hooks : undefined;
}

function buildCanUseTool(ctx: AgentContext, config: HarnessConfig): CanUseTool | undefined {
  if (!config.hooks.logToolUse) return undefined;

  return async (toolName, input) => {
    const ts = new Date().toISOString();
    const inputSummary = JSON.stringify(input).slice(0, 200);
    await mkdir(ctx.stateDir, { recursive: true });
    await appendFile(ctx.stderrLog, `${ts} [canUseTool] ${toolName} ${inputSummary}\n`);
    return { behavior: "allow" as const };
  };
}

export function buildOptions(
  ctx: AgentContext,
  opts: {
    resume?: string;
    systemPrompt: string;
    onInstructionsLoaded?: (filePath: string, memoryType: string, loadReason: string) => void;
  },
  config: HarnessConfig,
): Options {
  const hooks = buildHooks(ctx, config, opts.onInstructionsLoaded);
  const canUseTool = buildCanUseTool(ctx, config);

  return {
    model: config.model,
    systemPrompt: opts.systemPrompt,
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    tools: [],
    thinking: { type: "adaptive" },
    effort: config.effort,
    includePartialMessages: true,
    stderr: async (data: string) => {
      await mkdir(ctx.stateDir, { recursive: true });
      await appendFile(ctx.stderrLog, `${new Date().toISOString()} ${data}\n`);
    },
    mcpServers: createAgentServers(ctx, config),
    strictMcpConfig: true,
    agents: createAgentRegistry(ctx.name),
    ...(hooks ? { hooks } : {}),
    ...(canUseTool ? { canUseTool } : {}),
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

  const workspaceLine = `# Workspace\n\nYour workspace directory is \`${ctx.workspaceDir}\`. This is your persistent working directory — files you create here survive across sessions. You can also access any directories mounted in your sandbox config.`;

  const parts = [identity];
  if (memoryContext) {
    parts.push(
      `# Persistent Memory\n\nThe following is your accumulated context from previous sessions:\n\n${memoryContext}`,
    );
  }
  parts.push(dateLine);
  parts.push(workspaceLine);

  return parts.join("\n\n");
}

export function sendMessage(prompt: string, options: Options): Query {
  return query({ prompt, options });
}
