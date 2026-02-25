import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_CONFIG_YAML, getHomeDir } from "./config.js";

function getDefaultsDir(): string {
  return join(import.meta.dirname, "..", "defaults", "agents");
}

export function isFirstRun(): boolean {
  return !existsSync(getHomeDir());
}

export function runFirstRun(): void {
  const home = getHomeDir();
  const agentsDir = join(home, "agents");
  const stateDir = join(home, "state");

  mkdirSync(agentsDir, { recursive: true });
  mkdirSync(stateDir, { recursive: true });

  // Copy default agents
  const defaultsDir = getDefaultsDir();
  if (existsSync(defaultsDir)) {
    cpSync(defaultsDir, agentsDir, { recursive: true });
  }

  // Write default config
  writeFileSync(join(home, "config.yaml"), DEFAULT_CONFIG_YAML, "utf-8");

  console.log(`
Welcome to Masters of AI Harness.

Created ~/.mastersof-ai/ with default agents:
  assistant   general purpose
  analyst     research and analysis
  cofounder   co-founder template

Config:  ~/.mastersof-ai/config.yaml
Agents:  ~/.mastersof-ai/agents/

Create new agents:  mastersof-ai create <name>
List agents:        mastersof-ai --list-agents

Starting assistant...
`);
}
