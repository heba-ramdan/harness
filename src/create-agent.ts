import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getHomeDir } from "./config.js";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function createAgent(name: string): void {
  const agentsDir = join(getHomeDir(), "agents");
  const agentDir = join(agentsDir, name);

  if (existsSync(agentDir)) {
    console.error(`Agent "${name}" already exists at ${agentDir}`);
    process.exit(1);
  }

  const memoryDir = join(agentDir, "memory");
  mkdirSync(memoryDir, { recursive: true });

  const displayName = capitalize(name);
  const identity = `# ${displayName}

You are ${displayName}, a helpful AI assistant.

## How to work

- Be clear, concise, and direct.
- Use your tools when needed.
- Save important context to memory for future sessions.
`;

  writeFileSync(join(agentDir, "IDENTITY.md"), identity, "utf-8");

  console.log(`Created agent "${name}" at ${agentDir}`);
  console.log(`Edit ${join(agentDir, "IDENTITY.md")} to customize.`);
}
