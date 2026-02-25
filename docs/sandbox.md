# Sandbox

On Linux, the harness runs inside a [bubblewrap](https://github.com/containers/bubblewrap) (`bwrap`) container by default, isolating the agent's filesystem access. On other platforms, sandboxing is off (bwrap is Linux-only).

Use `--no-sandbox` to disable, or `--sandbox` to force on.

## How It Works

When sandboxing is active and `HARNESS_SANDBOXED` is not set, the harness:

1. Checks that `bwrap` is installed (exits with install instructions if not)
2. Resolves the agent and loads `sandbox.json` from the agent's directory (auto-creates a default if missing)
3. Re-executes itself under `bwrap` with `HARNESS_SANDBOXED=1` set
4. Inside the sandbox: system dirs are read-only, agent memory/session state are read-write, the workspace directory is read-write

## Agent Workspace

Each agent gets a workspace directory at `~/.mastersof-ai/agents/<name>/workspace/`, auto-created on first run. This is the agent's persistent working directory — files created here survive across sessions.

The workspace is always mounted read-write in sandbox mode and is the default working directory. Agents can access additional directories via `mounts` in `sandbox.json`.

## Per-Agent Config

Each agent can have a `sandbox.json` in its directory:

```json
{
  "workspace": "~/.mastersof-ai/agents/ember/workspace",
  "env": ["HOME", "PATH", "TERM"],
  "network": "host",
  "mounts": [
    { "path": "~/Projects/my-project", "mode": "rw" },
    { "path": "~/data", "mode": "ro" }
  ]
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `workspace` | Agent's workspace dir | Working directory, mounted read-write |
| `env` | `["HOME", "PATH", "TERM"]` | Environment variables to pass through |
| `network` | `"host"` | `"host"` or `"none"` (disables networking) |
| `mounts` | `[]` | Additional bind mounts with `"ro"` or `"rw"` mode |
| `enabled` | `true` | Set to `false` to skip sandboxing |

The legacy `project` field is still accepted and mapped to `workspace`.

## Environment Variables and Secrets

The sandbox starts with a clean environment (`--clearenv`). Variables reach the sandbox through two paths:

- **`env` whitelist** in `sandbox.json` — named vars from your shell are passed through (e.g. `"env": ["HOME", "PATH", "TERM", "ANTHROPIC_API_KEY"]`)
- **Agent `.env` file** — if the agent has a `.env` (encrypted or plaintext), it's decrypted before the sandbox starts and injected directly. No whitelist entry needed. See [Secrets](secrets.md) for details.

`DOTENV_PRIVATE_KEY` is explicitly excluded from the sandbox — only decrypted values enter.

## Namespace Isolation

The sandbox unshares PID and IPC namespaces. Network is shared by default but can be disabled per-agent. The child process dies with the parent (`--die-with-parent`).
