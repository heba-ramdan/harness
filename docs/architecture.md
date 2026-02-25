# Architecture

## What The Harness Is

A standalone terminal-based agent runtime. Install it, write a markdown agent definition, run an agent. That's the complete story.

The harness reads agent definitions (plain markdown files), connects them to a model, provides tools via MCP, and handles I/O through a React/Ink TUI.

## How It Works

1. User starts the harness (optionally specifying an agent)
2. Harness loads the agent definition — reads `IDENTITY.md` from the agent's directory
3. Loads persistent memory (`CONTEXT.md`) if present
4. Builds the system prompt: identity + memory + current date/timezone
5. Creates MCP tool servers based on config (only enabled tools)
6. Connects to the model via Claude Agent SDK
7. Launches TUI for interactive conversation
8. Handles tool calls, streaming responses, sub-agent delegation

## Source Layout

```
mastersof-ai-harness/
├── bin/mastersof-ai.js          — Entry point (tsx wrapper)
├── defaults/agents/             — Default agents (copied on first run)
│   ├── assistant/IDENTITY.md
│   ├── analyst/IDENTITY.md
│   └── cofounder/IDENTITY.md
├── src/
│   ├── index.tsx                — CLI entry, arg parsing, TUI launch
│   ├── config.ts                — Config loading + defaults
│   ├── first-run.ts             — First run setup
│   ├── create-agent.ts          — `mastersof-ai create <name>`
│   ├── agent-context.ts         — Resolve agent paths and content
│   ├── agent.ts                 — Build system prompt, SDK options
│   ├── prompt.ts                — Load identity/definition file
│   ├── sandbox.ts               — Bubblewrap sandbox (--sandbox)
│   ├── sessions.ts              — Session persistence
│   ├── agents/                  — Sub-agent definitions (TypeScript)
│   │   ├── index.ts
│   │   ├── researcher.ts
│   │   ├── deep-thinker.ts
│   │   └── writer.ts
│   ├── tools/                   — MCP tool servers
│   │   ├── index.ts             — Server creation (config-aware)
│   │   ├── memory.ts
│   │   ├── web.ts
│   │   ├── workspace.ts
│   │   ├── shell.ts
│   │   ├── introspection.ts
│   │   ├── model-query.ts
│   │   └── tasks.ts
│   ├── components/              — React/Ink TUI
│   │   ├── App.tsx              — Main app component
│   │   ├── ChatHistory.tsx
│   │   ├── InputArea.tsx
│   │   ├── StreamingResponse.tsx
│   │   ├── Message.tsx
│   │   ├── MultilineInput.tsx
│   │   └── ThinkingAnimation.tsx
│   ├── lib/                     — Utilities
│   │   ├── editor.ts            — External editor support (Ctrl+G)
│   │   └── ink-clear.ts         — Ink instance cleanup
│   └── types/
│       └── marked-terminal.d.ts — Type shim
└── package.json
```

## Tech Stack

- **Runtime:** Node.js + tsx (no build step)
- **SDK:** @anthropic-ai/claude-agent-sdk (Claude Agent SDK)
- **TUI:** React + Ink
- **Tools:** MCP protocol (in-process servers)
- **Config:** YAML
- **Sessions:** JSON files
- **Sandbox:** bubblewrap (bwrap)
