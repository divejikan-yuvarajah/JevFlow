# Development Guide

## Local workflow

Use Node.js 20.19 or newer. Install exactly from the committed lockfile when reproducing CI:

```bash
npm ci
```

Common commands:

- `npm run dev` runs the offline TypeScript bootstrap.
- `npm run typecheck` performs strict type checking without output.
- `npm run lint` checks source, tests, and ESLint configuration.
- `npm run format` formats project-owned files. Supplied phase prompts are intentionally excluded.
- `npm run format:check` verifies formatting.
- `npm test` runs the deterministic offline test suite once.
- `npm run test:watch` runs tests in watch mode for local development.
- `npm run build` compiles `src/` into `dist/`.
- `npm start` runs the compiled bootstrap.
- `npm run check` runs formatting, type checking, linting, tests, and build in sequence.

Tests require no network access or credentials.

## Environment and secrets

Copy `.env.example` to `.env` only when local overrides are useful. Never commit `.env`, API keys, GitHub tokens, or other credentials. Task 01 works without credentials and logs no secret values. Thresholds must be finite numbers in the inclusive range 0 through 1, and the review threshold cannot exceed the automatic threshold.

## Git workflow

Start each development phase from verified `main` on the branch named in the roadmap. Inspect existing work before editing, run `npm run check`, review the diff and staged files, then commit and merge normally after verification. Never discard user work, rewrite history, force push, or mix later phases into the active task.

See [the Codex workflow](codex-workflow.md) for the repository's phase execution process.
