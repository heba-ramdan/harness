# Contributing

## Reporting Bugs

Open an issue at [GitHub Issues](https://github.com/mastersof-ai/harness/issues) with steps to reproduce and your environment (OS, Node version).

## Submitting PRs

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run check` passes
4. Open a PR with a clear description of the change

## Local Development

```bash
npm install
npx tsx bin/mastersof-ai.js          # run locally
npm run check                        # lint + typecheck
```

## Code Style

[Biome](https://biomejs.dev/) handles formatting and linting. Run `npm run lint:fix` to auto-fix issues before committing.
