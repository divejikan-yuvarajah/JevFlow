# JevFlow Web Playground

This package contains the Task 06 Next.js App Router dashboard. It presents the existing JevFlow analyzer, deterministic confidence policy, and allowlisted proposed labels through a small public response contract. It does not implement a second classifier and never writes to GitHub.

## Install and run

Use Node.js 20.19 or newer. The server adapter consumes the root project's compiled ESM contract, so install both committed lockfiles from the repository root. Web development and validation scripts build the root core automatically:

```bash
npm ci
npm --prefix web ci
npm --prefix web run dev
```

Open `http://localhost:3000` for the playground and `http://localhost:3000/evaluation` for the latest valid local Task 05 summary.

## Offline preview

Preview Fixture is the default mode and requires no API key. It provides three fictional scenarios:

- an ordinary backend authentication bug;
- a possible invoice access security escalation;
- an ambiguous performance report that needs clarification.

Each preview is prominently labelled `SYNTHETIC PREVIEW — not a Jev result`. The example decision values are authored presentation fixtures, then processed by the real Task 03 policy and label mapper. They contain no measured latency and make no request to `/api/analyze`. Editing a sample invalidates its match instead of pretending the changed issue was analyzed.

## Optional local live mode

Live mode can consume paid TypeSafe AI Jev capacity and must be enabled deliberately. Copy `web/.env.example` to the ignored `web/.env.local`, then set:

```dotenv
JEVFLOW_LIVE_DEMO_ENABLED=true
TYPESAFE_API_KEY=your-local-server-side-key
```

Never prefix the credential with `NEXT_PUBLIC_`. Restart the development server after changing the file. The live route requires both values, runs only when `NODE_ENV=development`, and invokes the existing root `analyzeIssue` service at most once per accepted application submission. It then calls the existing confidence policy and proposed-label mapper.

Production live requests are rejected. This local guard is not a production authentication or distributed rate-limit system. A future public deployment with paid inference requires separate authentication, abuse controls, and operational review.

## Security boundaries

- `lib/core-adapter.ts` is server-only. Provider and credential code cannot be imported into client components.
- `/api/analyze` accepts only bounded JSON with `title` and `body`, disables caching, and returns sanitized errors.
- The public result excludes issue text, credentials, raw SDK data, raw provider errors, auth headers, and filesystem paths.
- Preview failure never falls back from a live request or disguises a provider failure as synthetic output.
- The dashboard contains no Octokit adapter and cannot label, comment on, or otherwise modify GitHub issues.
- Proposed labels are exact values from the root allowlist and are visibly marked as local proposals.

## Evaluation view

The evaluation page reads only valid JSON from the fixed root `evals/results/` directory. It projects aggregate Task 05 fields and does not expose issue cases or local paths. When no valid report is present it shows an honest empty state and generation command.

Offline fixture metrics measure the deterministic evaluation harness and policy. They are not Jev accuracy, calibration, latency, cost, or production performance. Provider latency appears only for a valid live report that actually contains it.

## Commands

```bash
npm --prefix web run dev
npm --prefix web run build
npm --prefix web run start
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web run test
npm --prefix web run check
```

All tests use fixtures or injected analyzers. Build, test, checks, page load, offline preview, and report display do not call Jev or GitHub.

## Current limitations

- Live mode is intentionally local-development-only.
- There is no authentication, database, multi-user state, or browser GitHub mutation.
- Evaluation reports are local generated artifacts and remain Git-ignored.
- Public deployment and release media belong to Task 07.
