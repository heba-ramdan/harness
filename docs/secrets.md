# Secrets

Agents that need API keys or other secrets (e.g. `BRAVE_API_KEY` for web search) can store them in a per-agent `.env` file, optionally encrypted with [dotenvx](https://dotenvx.com).

## How It Works

At startup, after resolving the agent but before anything else, the harness calls `dotenvx.config()` on `~/.mastersof-ai/agents/{name}/.env` if it exists. Decrypted values are merged into `process.env` (existing shell env vars take precedence — the `.env` provides defaults, not overrides).

Tools read `process.env` at call time, so any key in the `.env` is available to the agent's tools.

## Setup

```bash
# Install dotenvx CLI if you don't have it
brew install dotenvx/brew/dotenvx  # or: npm install -g @dotenvx/dotenvx

# Create an encrypted .env for an agent
cd ~/.mastersof-ai/agents/cofounder
dotenvx set BRAVE_API_KEY "your-key-here"
```

This creates two files:

- `.env` — contains the encrypted value (safe at rest)
- `.env.keys` — contains the private key needed to decrypt

Add `DOTENV_PRIVATE_KEY` to your shell so the harness can decrypt at startup:

```bash
# Grab the key from .env.keys and add to your profile
echo 'export DOTENV_PRIVATE_KEY="<key from .env.keys>"' >> ~/.bashrc
```

Or use dotenvx to inject it at launch time:

```bash
dotenvx run -f ~/.env.keys -- npx tsx bin/mastersof-ai.js --agent cofounder
```

## Plaintext .env

Encryption is optional. A plain `.env` works too:

```
BRAVE_API_KEY=your-key-here
```

No `DOTENV_PRIVATE_KEY` needed in this case. The tradeoff is the secret is stored in plaintext on disk.

## Two Ways to Provide Secrets

| Method | How | Best for |
|--------|-----|----------|
| Shell environment | `export BRAVE_API_KEY=xxx` in your profile | Simple setups, all agents share the same keys |
| Per-agent `.env` | Encrypted file in agent's directory | Per-agent isolation, secrets encrypted at rest |

Both work. Shell env takes precedence over `.env` values, so you can override per-agent defaults from your shell.

## Sandbox Mode

In sandbox mode (`--sandbox`), `bwrap --clearenv` wipes the environment. Secrets reach the sandbox through two channels:

1. **`sandbox.json` `env` whitelist** — passes named vars from your shell into the sandbox. Use this for vars you set in your shell profile.
2. **Agent `.env`** — decrypted before the sandbox starts, injected directly via `--setenv`. No whitelist entry needed.

`DOTENV_PRIVATE_KEY` is explicitly excluded from the sandbox — the sandboxed process receives only the decrypted values, never the key itself.
