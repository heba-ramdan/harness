# Masters Of AI Harness — Design

A standalone terminal-based agent runtime. Write a markdown agent definition, run an agent. The harness reads `IDENTITY.md` files, connects them to a model via the Claude Agent SDK, provides tools via in-process MCP servers, and handles I/O through a React/Ink TUI.

## Docs

- **[Architecture](docs/architecture.md)** — how it works, source layout, tech stack
- **[Agents](docs/agents.md)** — agent loading, identity, sub-agents
- **[Memory](docs/memory.md)** — persistent memory system, auto-loaded context, memory tools
- **[Tools](docs/tools.md)** — tool system, available tools, design principles
- **[Configuration](docs/configuration.md)** — config file, CLI, first run, sessions, user directory layout
- **[Secrets](docs/secrets.md)** — per-agent encrypted secrets via dotenvx
- **[Sandbox](docs/sandbox.md)** — bubblewrap isolation, per-agent config
- **[Design Decisions](docs/design-decisions.md)** — rationale for key choices
