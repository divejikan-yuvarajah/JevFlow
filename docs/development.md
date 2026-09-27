# Development Guide

## Setup

Clone or open the main JevFlow source repository, then confirm the runtime:

```bash
node --version
npm --version
npm ci
```

Node.js 20.19 or newer is required. With `nvm`, run `nvm use` from the repository root. On Windows without `nvm-windows`, install a supported Node release directly and reopen the terminal. Root and `web/` are separate npm packages; install both when working on the dashboard.

Local configuration is optional for offline work:

```powershell
Copy-Item .env.example .env
Copy-Item web/.env.example web/.env.local
```

On macOS or Linux, use `cp` instead. Both destination files are ignored. Leave secrets blank unless a specific live command has been approved.

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
- `npm run triage -- --help` shows the local file-driven CLI without requiring credentials.
- `npm run triage:github` is the guarded GitHub Actions runner; do not invoke it as a local smoke test.
- `npm run eval -- --mode fixture` runs the complete deterministic offline evaluation.
- `npm run eval:fixtures` is the explicit fixture-mode shorthand.
- `npm run smoke:jev` makes one explicit live Jev request and is excluded from normal checks.

Tests use injected provider fixtures shaped like the installed SDK contract. They require no network access or credentials.

## Web dashboard development

The root core and `web/` app keep independent lockfiles. Install both in a clean checkout because the server adapter consumes the root package's compiled ESM output and provider dependencies. Web development, lint, type checking, tests, and build run the root build automatically before their own command:

```powershell
npm ci
npm --prefix web ci
npm --prefix web run dev
```

The local URL is `http://localhost:3000`. The default experience is the offline synthetic preview. It needs no key and sends no analysis request. Run all web validation independently with:

```powershell
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web run test
npm --prefix web run build
npm --prefix web run check
```

To make a deliberate live request, create ignored `web/.env.local` from `web/.env.example`, set `JEVFLOW_LIVE_DEMO_ENABLED=true`, and add `TYPESAFE_API_KEY` without a `NEXT_PUBLIC_` prefix. Restart the development server. Each accepted submit can consume paid provider capacity. The route rejects production requests even if those values are present. Build, test, preview, page load, and evaluation display never initiate inference.

The evaluation page reads the newest valid JSON summary under `evals/results/`. Generate an offline artifact from the repository root when needed:

```powershell
npm run eval -- --mode fixture --format json --output evals/results/dashboard-evaluation.json
```

Generated reports remain ignored. Fixture metrics describe harness behavior and must not be presented as live Jev performance.

### Public repository browser

The `/repositories` page works without provider credentials. Enter a public GitHub URL supplied for the test or use `owner/repo`. The web server performs unauthenticated, read-only GitHub requests; expect public API rate limits. Linked identifiers live only in browser local storage, and selected issue text uses a one-time session handoff to the playground.

Offline tests inject the GitHub reader or mock `fetch`; they do not contact GitHub. Run the repository-specific tests with:

```powershell
npm --prefix web exec vitest run tests/repository-parser.test.ts tests/public-github-client.test.ts tests/repository-handlers.test.ts tests/linked-repositories.test.ts tests/connected-repositories.test.tsx
```

Publishing or configuring `jevflow-test-repo` remains a manual, separately authorized task. Follow [Connected Repositories](connected-repositories.md) for the read-only flow and [deployment](deployment.md) for the independent Actions installation.

## Environment and secrets

Copy `.env.example` to `.env` only when local overrides are useful. Never commit `.env`, API keys, GitHub tokens, or other credentials. The bootstrap and offline checks work without credentials and log no secret values. Thresholds must be finite numbers in the inclusive range 0 through 1, and the review threshold cannot exceed the automatic threshold.

The installed official TypeSafe AI SDK requires Node.js 20 or newer. A real call requires `TYPESAFE_API_KEY`; keep it only in the ignored `.env` file or a secure environment variable. The SDK adapter uses logging level `off` so issue bodies and request data are not emitted.

The smoke test can consume paid API capacity and must be run only when a live request is explicitly intended:

```powershell
npm run smoke:jev
```

It uses a harmless invented issue. Never paste an API key into source code, documentation, terminal history, or chat. A missing key produces a sanitized nonzero failure.

## Local issue triage

Use the synthetic example or another JSON object matching `IssueInput`:

```powershell
npm run triage -- --file examples/sample-issue.json
npm run triage -- --file examples/sample-issue.json --json
```

The CLI rejects unknown flags, missing or malformed files, files larger than 64 KiB, invalid issue input, invalid thresholds, and analyzer failures with a nonzero exit code. It never prints the issue body or credentials. Human output distinguishes selected probability, reported choice confidence, and binary P(YES); JSON output emits one machine-readable document.

File-based analysis is an explicit live Jev operation and may consume paid capacity. It makes no GitHub API call and only proposes allowlisted labels locally. Use injected analyzers in tests; `npm test`, `npm run check`, `npm run dev`, `npm start`, and CLI help remain offline.

## GitHub Actions development

The GitHub runner accepts only the Actions environment, a bounded event file, a repository identity that matches the event, and one of the supported triggers. Manual dispatch validates a positive safe integer and fetches the current issue before inference. Tests call the parser, orchestrator, and API adapter with injected file readers, analyzers, and request functions; no token, API key, network connection, or remote issue is used by `npm run check`.

The source workflow handles issues in this repository. A workflow must be present on a repository's default branch to receive its issue events, so the independent test repository uses the template and checklist in `deploy/target-repo/`. Its automatic token belongs to that target repository. Review the Actions job summary for normalized probabilities, policy reasons, and actual label operations after any explicitly authorized live run.

Manual dispatch from the GitHub Actions UI takes an existing issue number. Repeating it should yield no writes when labels already match. Never simulate the guarded runner with personal credentials in an ordinary local shell; use injected test dependencies instead.

## Evaluation development

The committed dataset and fixtures use schema `1.0` and must remain one-to-one in ordered IDs `JF-001` through `JF-030`. `npm run check` validates the dataset, fixtures, metric arithmetic, reports, live gate, policy behavior, and injected GitHub integration without credentials or network access.

Generated reports belong under `evals/results/` and are ignored except for `.gitkeep`. Use an explicit unique `.json` or `.md` name. Fixture output must remain labeled synthetic and must report Jev latency as unavailable.

The only live evaluation command is deliberately explicit:

```powershell
npm run eval -- --mode live --confirm-live --limit 1
```

It requires separate current-session authorization and a locally configured `TYPESAFE_API_KEY`. It invokes the existing analyzer sequentially, can consume paid capacity, and is excluded from tests, `npm run check`, and CI. Evaluation never requires `GITHUB_TOKEN`.

## Git workflow

Start each development phase from verified `main` on the branch named in the roadmap. Inspect existing work before editing, run `npm run check`, review the diff and staged files, then commit and merge normally after verification. Never discard user work, rewrite history, force push, or mix later phases into the active task.

See [the Codex workflow](codex-workflow.md) for the repository's phase execution process.

## Troubleshooting

- **`npm ci` reports a lock mismatch:** use the lockfile from the current branch. Do not regenerate it unless a dependency change is intentional and reviewed.
- **Web imports under `dist/` are missing:** run `npm run build` at the root. Every web check also runs this through `prepare:core`.
- **The evaluation page has no report:** generate an ignored JSON artifact under `evals/results/` with the fixture command above, then reload the page.
- **Live dashboard mode stays disabled:** it works only under `next dev`, requires both values in `web/.env.local`, and needs a server restart. It is intentionally disabled in production builds.
- **Public repository loading is rate limited:** wait for the reported interval and retry. The dashboard intentionally does not add a token or authenticated fallback.
- **A live CLI reports a missing key:** confirm `TYPESAFE_API_KEY` is present in the intended process environment or ignored `.env`. Do not print the value while diagnosing it.
- **GitHub manual dispatch fails validation:** enter an existing positive integer issue number. The application rejects pull requests and repository identity mismatches.
- **Node type or build errors appear only in one package:** verify both `npm ci` commands completed and run root checks before the independent web checks.

## Safe branch workflow

```bash
git switch main
git status --short
git switch -c <focused-branch>
npm run check
npm --prefix web run check
```

Review `git diff --check`, staged files, and secret-like text before committing. Never run a live analyzer merely because a local key exists, and never push, tag, deploy, or publish without the project owner's explicit authorization.
