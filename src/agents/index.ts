import type { AgentDefinition } from "@anthropic-ai/claude-agent-sdk";
import { createDeepThinker } from "./deep-thinker.js";
import { createResearcher } from "./researcher.js";
import { createWriter } from "./writer.js";

export function createAgentRegistry(agentName: string): Record<string, AgentDefinition> {
  const toolPrefix = `${agentName}-`;
  return {
    researcher: createResearcher(toolPrefix),
    "deep-thinker": createDeepThinker(toolPrefix),
    writer: createWriter(toolPrefix),
  };
}
