# Masters Of AI Harness — Design Document

*Last updated: 2026-02-24*

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

## Agent Loading

The harness reads agent definitions from `~/.mastersof-ai/agents/`.

### Resolution

Each agent is a directory under `agents/` containing an `IDENTITY.md` file:

```
~/.mastersof-ai/agents/{name}/
├── IDENTITY.md          — Plain markdown, becomes the system prompt
└── memory/
    └── CONTEXT.md       — Persistent memory (optional)
```

`resolveAgent(name)` checks that `agents/{name}/` exists and contains `IDENTITY.md`. If either is missing, the harness exits with an error.

### System Prompt Assembly

```
[Agent identity — the IDENTITY.md content]
[Persistent memory from CONTEXT.md, if present]
[Current date, time, and timezone]
```

The identity file is loaded as-is (no frontmatter parsing). Memory is wrapped with a header explaining it's accumulated context from previous sessions. Date/time uses the system timezone.

## Tool System

Tools are in-process MCP servers, one per domain. Each can be enabled/disabled via config. Agents discover available tools at runtime — they don't declare dependencies.

| Tool | What It Does | Scope |
|------|-------------|-------|
| **memory** | Read/write/search agent's persistent memory | `agents/{name}/memory/` |
| **web** | Web search and URL fetch | Internet |
| **workspace** | File operations (read, write, list, search) | `process.cwd()` |
| **shell** | Execute shell commands | `process.cwd()` |
| **tasks** | Lightweight task tracking | Agent-scoped |
| **introspection** | Read/propose changes to own identity | Agent's definition file |
| **models** | Query other Claude models | Anthropic API |

### Design Principle

Agents discover tools at runtime from the harness. An agent doesn't need to know what tools exist when it's defined — it adapts to what's available when it runs. Like a developer sitting down at a new workstation and figuring out what's installed.

This keeps agent definitions portable. The same agent definition works in a harness with all tools enabled or one with only memory and web.

## Sub-Agents

The harness supports sub-agent delegation — the primary agent can spawn specialized agents for tasks like research, deep thinking, or writing.

### Current Implementation

Sub-agents are defined in TypeScript (`src/agents/*.ts`). Each has a name, model, system prompt, and tool access. They are registered via `createAgentRegistry()` and passed to the Claude Agent SDK.

## Config System

Global config lives at `~/.mastersof-ai/config.yaml`.

```yaml
model: claude-opus-4-6
defaultAgent: cofounder
tools:
  memory:
    enabled: true
  web:
    enabled: true
  workspace:
    enabled: true
  shell:
    enabled: true
  tasks:
    enabled: true
  introspection:
    enabled: true
  models:
    enabled: true
```

Config is loaded at startup, deep-merged with defaults. Tools are only created if enabled. Model is read from config and passed to the SDK.

## First Run

On first run (`~/.mastersof-ai/` doesn't exist), the harness:

1. Creates `~/.mastersof-ai/` with `agents/`, `contexts/`, `intents/`, `state/` dirs
2. Copies default agent definitions from bundled defaults
3. Writes default `config.yaml`
4. Prints welcome message

## Sessions

Conversations persist as session files in `~/.mastersof-ai/state/{agent}/sessions/`. The `--resume` flag continues the last session. Sessions are JSON arrays of message turns.

## Sandbox

The `--sandbox` flag runs the harness inside a [bubblewrap](https://github.com/containers/bubblewrap) (`bwrap`) container, isolating the agent's filesystem access.

### How It Works

When `--sandbox` is passed and `HARNESS_SANDBOXED` is not set, the harness:

1. Resolves the agent and loads `sandbox.json` from the agent's directory (auto-creates a default if missing)
2. Re-executes itself under `bwrap` with the `--sandbox` flag stripped and `HARNESS_SANDBOXED=1` set
3. Inside the sandbox: system dirs are read-only, agent memory and session state are read-write, the project directory (from `sandbox.json`) is read-write

### Per-Agent Config

Each agent can have a `sandbox.json` in its directory:

```json
{
  "project": "/home/user/my-project",
  "env": ["HOME", "PATH", "TERM"],
  "network": "host",
  "mounts": [
    { "path": "~/data", "mode": "ro" }
  ]
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `project` | `process.cwd()` | Working directory, mounted read-write |
| `env` | `["HOME", "PATH", "TERM"]` | Environment variables to pass through |
| `network` | `"host"` | `"host"` or `"none"` (disables networking) |
| `mounts` | `[]` | Additional bind mounts with `"ro"` or `"rw"` mode |
| `enabled` | `true` | Set to `false` to skip sandboxing even with `--sandbox` |

### Namespace Isolation

The sandbox unshares PID and IPC namespaces. Network is shared by default but can be disabled per-agent. The child process dies with the parent (`--die-with-parent`).

## CLI Interface

```
mastersof-ai                          # Start with default agent
mastersof-ai --agent researcher       # Start with specific agent
mastersof-ai --message "do X"         # Non-interactive single message
mastersof-ai --resume                 # Resume last session
mastersof-ai --sandbox                # Run in bubblewrap sandbox
mastersof-ai --list-agents            # Show available agents
mastersof-ai --init                   # Force first-run setup
mastersof-ai create <name>            # Create a new agent
```

## Architecture

```
mastersof-ai-harness/
├── bin/mastersof-ai.js          — Entry point (tsx wrapper)
├── defaults/agents/             — Default agents (copied on first run)
│   ├── assistant/IDENTITY.md
│   ├── analyst/IDENTITY.md
│   └── cofounder/
│       ├── IDENTITY.md
│       └── sandbox.json
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

## User Directory Layout

After install and first run:

```
~/.mastersof-ai/
├── config.yaml                    — Global config
├── agents/                        — Agent definitions
│   ├── assistant/
│   │   ├── IDENTITY.md            — Agent identity (system prompt)
│   │   └── memory/                — Persistent memory
│   │       └── CONTEXT.md
│   ├── analyst/
│   │   └── IDENTITY.md
│   └── cofounder/
│       ├── IDENTITY.md
│       ├── sandbox.json           — Per-agent sandbox config
│       └── memory/
├── contexts/                      — Shared context blocks (reserved)
├── intents/                       — Shared intent blocks (reserved)
└── state/                         — Session data
    └── cofounder/sessions/
```

## Current Status

### Done

| Feature | File(s) |
|---------|---------|
| Config system (load, merge, defaults) | `config.ts` |
| First run experience | `first-run.ts` |
| Tool enable/disable from config | `tools/index.ts` |
| Model from config | `agent.ts` |
| CLI flags (--agent, --message, --resume, --init, --list-agents, --sandbox) | `index.tsx` |
| `create` subcommand | `create-agent.ts` |
| Default agents (assistant, analyst, cofounder) | `defaults/agents/` |
| Workspace/shell scoped to cwd | `tools/workspace.ts`, `tools/shell.ts` |
| TUI (streaming, thinking, tool use display) | `components/` |
| Sessions (save/load/resume) | `sessions.ts` |
| Sub-agents (researcher, deep-thinker, writer) | `agents/` |
| Timezone detection | `agent.ts` |
| Bubblewrap sandbox (`--sandbox`) | `sandbox.ts` |
| Strict MCP config (per-agent tool isolation) | `agent.ts` |

### Needs Work

These are future enhancements. None of the features below are implemented yet.

#### Priority 1: Sub-Agent Migration

Move sub-agents from TypeScript definitions to `.md` files with `metadata.role: sub-agent`.

**Files to change:**

- **`src/agents/index.ts`** — scan agents dir for `.md` files with `metadata.role: sub-agent`, parse into Claude SDK agent definitions.

- **Delete** `src/agents/researcher.ts`, `deep-thinker.ts`, `writer.ts` after migration.

- **Create** default sub-agent `.md` files in `defaults/agents/`.

#### Priority 3: npm Packaging

- Package: `@mastersof-ai/harness`
- Binary: `mastersof-ai`
- Test: `npm pack` → install in fresh dir → run
- Publish to npm

#### Priority 4: Documentation

- README.md: install, first run, create agent, customize
- Keep it short

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Standalone | Reads format directly | Independence, simpler install, no coupling |
| Tools discovered at runtime | Agent adapts to harness | Portable definitions, no dep declarations |
| In-process MCP servers | One server per tool domain | No external processes, fast, simple |
| Config-driven tool enable/disable | `config.yaml` controls what's available | User controls their environment |
| Legacy format fallback (planned) | IDENTITY.md will still work | Don't break existing agents |
| tsx as runtime | No build step for JSX | Simpler than bundling React/Ink |
| `~/.mastersof-ai/` home dir | Global config + agents + state | Standard Unix convention |
| Memory as a tool | Not baked into core | Just another context source |
| Sub-agents as .md files (planned) | Same format as primary agents | Uniform, composable, portable |
| Bubblewrap sandbox | Optional `--sandbox` flag | Isolate agent filesystem access without Docker overhead |

## Tech Stack

- **Runtime:** Node.js + tsx (no build step)
- **SDK:** @anthropic-ai/claude-agent-sdk (Claude Agent SDK)
- **TUI:** React + Ink
- **Tools:** MCP protocol (in-process servers)
- **Config:** YAML
- **Sessions:** JSON files
- **Sandbox:** bubblewrap (bwrap)
