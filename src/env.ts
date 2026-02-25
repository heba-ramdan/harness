import { existsSync } from "node:fs";
import { join } from "node:path";
import dotenvx from "@dotenvx/dotenvx";

/**
 * Load per-agent .env file (encrypted or plaintext) into process.env.
 * Returns the parsed key-value pairs for sandbox passthrough.
 */
export function loadAgentEnv(agentDir: string): Record<string, string> {
  const envPath = join(agentDir, ".env");
  if (!existsSync(envPath)) return {};

  const result = dotenvx.config({ path: envPath, quiet: true });
  return (result.parsed as Record<string, string>) ?? {};
}
