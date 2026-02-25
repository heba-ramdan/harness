import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { getHomeDir } from "./config.js";

export interface AgentContext {
  name: string;
  agentDir: string;
  identityPath: string;
  memoryDir: string;
  contextFile: string;
  stateDir: string;
  sessionsDir: string;
  lastSessionFile: string;
  proposalsDir: string;
  stderrLog: string;
  workspaceDir: string;
}

export const DEFAULT_AGENT = "cofounder";

export function getAgentsDir(): string {
  return join(getHomeDir(), "agents");
}

export function resolveAgent(name: string): AgentContext {
  const agentDir = join(getAgentsDir(), name);
  const identityPath = join(agentDir, "IDENTITY.md");

  if (!existsSync(agentDir)) {
    console.error(`Agent "${name}" not found — ~/.mastersof-ai/agents/${name}/ does not exist`);
    process.exit(1);
  }
  if (!existsSync(identityPath)) {
    console.error(`Agent "${name}" has no IDENTITY.md — ~/.mastersof-ai/agents/${name}/IDENTITY.md not found`);
    process.exit(1);
  }

  const stateDir = join(getHomeDir(), "state", name);
  const workspaceDir = join(agentDir, "workspace");
  mkdirSync(workspaceDir, { recursive: true });

  return {
    name,
    agentDir,
    identityPath,
    memoryDir: join(agentDir, "memory"),
    contextFile: join(agentDir, "memory", "CONTEXT.md"),
    stateDir,
    sessionsDir: join(stateDir, "sessions"),
    lastSessionFile: join(stateDir, "last-session-id"),
    proposalsDir: join(stateDir, "proposals"),
    stderrLog: join(stateDir, "stderr.log"),
    workspaceDir,
  };
}
