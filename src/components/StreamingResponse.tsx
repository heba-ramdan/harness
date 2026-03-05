import { Box, Text } from "ink";
import React from "react";
import type { SubagentProgress, ToolAction } from "./App.js";
import { ThinkingAnimation } from "./ThinkingAnimation.js";

function thinkingPreview(text: string, maxLines = 3): string {
  const lines = text.trimEnd().split("\n");
  const tail = lines.slice(-maxLines);
  return tail.join("\n");
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  return `${Math.round(n / 1000)}K`;
}

interface StreamingResponseProps {
  text: string;
  thinking: string;
  toolActions: ToolAction[];
  subagentProgress: Map<string, SubagentProgress>;
  agentName: string;
}

export function StreamingResponse({
  text,
  thinking,
  toolActions,
  subagentProgress,
  agentName,
}: StreamingResponseProps) {
  const showThinking = thinking && !text;
  const displayName = agentName.charAt(0).toUpperCase() + agentName.slice(1);
  const activeSubagents = [...subagentProgress.values()].filter((s) => s.status === "running");

  return (
    <Box flexDirection="column" marginTop={1}>
      {showThinking && (
        <Box flexDirection="column">
          <Text color="gray" italic>
            {thinkingPreview(thinking)}
          </Text>
        </Box>
      )}
      {text && (
        <>
          <Text color="magenta" bold>
            {displayName}:
          </Text>
          <Text>{text}</Text>
        </>
      )}
      {toolActions.map((action, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: sequential tool log
        <Box key={i}>
          <Text dimColor>
            {"  "}→ {action.name}
          </Text>
          {action.detail && (
            <Text color="gray">
              {"  "}
              {action.detail}
            </Text>
          )}
        </Box>
      ))}
      {activeSubagents.map((sa) => (
        <Box key={sa.taskId}>
          <Text color="cyan">
            {"  "}⊳ {sa.description || "subagent"}
          </Text>
          <Text dimColor>
            {"  "}
            {sa.toolUses} tools · {formatDuration(sa.durationMs)}
            {sa.totalTokens > 0 ? ` · ${formatTokens(sa.totalTokens)} tokens` : ""}
          </Text>
        </Box>
      ))}
      <ThinkingAnimation compact={!!text || !!thinking} agentName={agentName} />
    </Box>
  );
}
