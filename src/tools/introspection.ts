import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tool } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const SRC_DIR = join(import.meta.dirname, "..");

export function createIntrospectionTools(ctx: { identityPath: string; proposalsDir: string }) {
  const promptRead = tool(
    "prompt_read",
    "Read your own identity file (IDENTITY.md). Use this to reflect on your current identity, behavior, and instructions before proposing changes.",
    {},
    async () => {
      const content = await readFile(ctx.identityPath, "utf-8");
      return { content: [{ type: "text" as const, text: content }] };
    },
    { annotations: { readOnlyHint: true } },
  );

  const promptPropose = tool(
    "prompt_propose",
    "Propose a change to your own identity or system prompt. Appends to proposals directory for review. Use this when you notice something about your behavior that should change, a better framing, or missing context.",
    {
      section: z.string().describe("Which section or aspect of the prompt to change"),
      reason: z.string().describe("Why this change — what insight or observation triggered it"),
      proposal: z.string().describe("The proposed new text or modification"),
    },
    async ({ section, reason, proposal }) => {
      await mkdir(ctx.proposalsDir, { recursive: true });
      const filepath = join(ctx.proposalsDir, "prompt-proposals.md");
      const timestamp = new Date().toISOString();
      const entry = `\n---\n\n## Proposal — ${timestamp}\n\n**Section:** ${section}\n\n**Reason:** ${reason}\n\n**Proposed change:**\n\n${proposal}\n`;
      const existing = existsSync(filepath) ? await readFile(filepath, "utf-8") : "# Prompt Proposals\n";
      await writeFile(filepath, existing + entry, "utf-8");
      return { content: [{ type: "text" as const, text: "Prompt proposal recorded for review." }] };
    },
  );

  const toolsRead = tool(
    "tools_read",
    "Read your own tools source code (src/tools/). Use this to understand your current capabilities and how they work before proposing new tools or changes.",
    {},
    async () => {
      const toolsDir = join(SRC_DIR, "tools");
      const files = await readdir(toolsDir);
      const tsFiles = files.filter((f) => f.endsWith(".ts"));

      const contents = await Promise.all(
        tsFiles.map(async (f) => {
          const content = await readFile(join(toolsDir, f), "utf-8");
          return `// === ${f} ===\n${content}`;
        }),
      );

      return { content: [{ type: "text" as const, text: contents.join("\n\n") }] };
    },
    { annotations: { readOnlyHint: true } },
  );

  const toolsPropose = tool(
    "tools_propose",
    "Propose a change to your own tools. Appends to proposals directory for review. Use this when you identify a missing capability, a tool improvement, or a new tool that would make you more effective.",
    {
      tool_name: z.string().describe("Name of the tool to add or modify"),
      reason: z.string().describe("Why this change — what need or gap does it address"),
      proposal: z.string().describe("Description of the proposed tool or change, including behavior and parameters"),
    },
    async ({ tool_name, reason, proposal }) => {
      await mkdir(ctx.proposalsDir, { recursive: true });
      const filepath = join(ctx.proposalsDir, "tools-proposals.md");
      const timestamp = new Date().toISOString();
      const entry = `\n---\n\n## Proposal: ${tool_name} — ${timestamp}\n\n**Reason:** ${reason}\n\n**Proposed change:**\n\n${proposal}\n`;
      const existing = existsSync(filepath) ? await readFile(filepath, "utf-8") : "# Tools Proposals\n";
      await writeFile(filepath, existing + entry, "utf-8");
      return {
        content: [{ type: "text" as const, text: `Tools proposal for '${tool_name}' recorded for review.` }],
      };
    },
  );

  const currentTime = tool(
    "current_time",
    "Get the current date, time, and timezone. Use this whenever you need to know the actual time — the date in your system prompt may be stale.",
    {},
    async () => {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const now = new Date();
      const date = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
      return { content: [{ type: "text" as const, text: `${date}, ${time} (${tz})` }] };
    },
    { annotations: { readOnlyHint: true } },
  );

  return [promptRead, promptPropose, toolsRead, toolsPropose, currentTime];
}
