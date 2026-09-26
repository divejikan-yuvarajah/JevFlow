# JevFlow

Confidence-aware GitHub issue triage powered by TypeSafe AI Jev.

JevFlow is being built to help maintainers classify incoming GitHub issues, evaluate decision confidence, and route uncertain or security-sensitive cases to a human. The planned flow is GitHub issue input → Jev typed decisions → normalized results → deterministic confidence policy → proposed labels or human review → GitHub automation.

## Current status

Tasks 01–06 provide the runnable foundation, Jev triage engine, deterministic confidence policy, secure GitHub automation, reproducible evaluation harness, and local decision dashboard:

- Node.js 20+ with strict TypeScript ESM
- canonical issue classification vocabulary and input type
- validated environment configuration
- an offline bootstrap CLI
- formatting, linting, tests, build, and CI configuration
- bounded runtime validation for untrusted issue input
- five typed questions submitted in one official Jev SDK call
- strict provider-response normalization through `analyzeIssue`
- conservative confidence gating and safety escalation
- allowlisted local GitHub label proposals
- a file-driven local triage CLI with human and JSON output
- bounded and repository-verified GitHub event parsing
- allowlisted, minimal GitHub label reconciliation with safe failure escalation
- sanitized GitHub Actions summaries
- source-repository and separately configurable target-repository workflows
- a versioned 30-case synthetic evaluation dataset and annotation rubric
- deterministic offline metrics with JSON and Markdown reports
- an explicitly gated, sequential live Jev benchmark path
- a responsive Next.js playground with three clearly identified synthetic previews
- a guarded, development-only server route that reuses the existing analyzer, policy, and label mapper
- a read-only evaluation view for valid local Task 05 reports

The automation can mutate labels only when the guarded Actions runner receives a supported, validated event and repository-scoped credentials. The dashboard never mutates GitHub. No live workflow, live Jev benchmark, or dashboard Jev request has been run as part of the offline implementation. The regular bootstrap, validation commands, fixture evaluation, dashboard preview, and CLI help do not make network requests.

## Requirements

- Node.js 20.19 or newer
- npm

## Get started

```bash
npm install
```

Optionally create local environment settings from `.env.example`. No TypeSafe API key is needed for the bootstrap, build, or offline test suite.

```powershell
Copy-Item .env.example .env
```

Run the local bootstrap and all validation:

```bash
npm run dev
npm run check
```

Build and run the compiled application:

```bash
npm run build
npm start
```

## Jev integration

The public `analyzeIssue` service validates and bounds an issue, asks TypeSafe AI Jev three choice questions and two NOUL questions in one `systemOne` invocation, then returns a provider-independent result. Choice results preserve the selected option's probability and the SDK-reported confidence as separate metrics. NOUL results are represented as P(YES), not booleans or confidence scores.

A live smoke test is manual and may use paid API capacity. Put `TYPESAFE_API_KEY` in the ignored local `.env` file, then run it only when explicitly intended:

```bash
npm run smoke:jev
```

The command submits one harmless invented issue and prints only a normalized result. It is excluded from `npm run check` and CI.

## Local triage CLI

The CLI accepts one issue JSON file, invokes the existing Jev analyzer, evaluates deterministic policy, and prints proposed labels without contacting GitHub:

```bash
npm run triage -- --help
npm run triage -- --file examples/sample-issue.json
npm run triage -- --file examples/sample-issue.json --json
```

The file-based commands make one application-level Jev request and therefore require a locally configured `TYPESAFE_API_KEY`. Run them only when live inference is explicitly intended. `--help` is offline and requires no key. Proposed labels are not applied to any issue by this local CLI.

## GitHub automation

The guarded `npm run triage:github` entry point reads a bounded `GITHUB_EVENT_PATH` on GitHub Actions. It supports `issues.opened` and validated manual dispatch by issue number. It then uses the existing analyzer, policy, and label mapper before applying only exact labels from JevFlow's static catalog. A provider or policy failure on an already trusted issue attempts a `jev:human-review` fallback without inventing category decisions.

The main workflow at `.github/workflows/jevflow-triage.yml` applies only to this repository. The separate template in `deploy/target-repo/` must be configured with a reviewed public source owner and immutable commit SHA, then copied to the target repository's default branch. See the [target repository install guide](deploy/target-repo/README.md). Live inference and GitHub mutation can consume paid capacity and require explicit authorization.

## Evaluation

The default evaluation mode loads 30 fictional issues and matching authored normalized decisions, then reuses the existing confidence policy and label mapper:

```bash
npm run eval -- --help
npm run eval -- --mode fixture
npm run eval -- --mode fixture --format json
npm run eval -- --mode fixture --format json --output evals/results/<unique-name>.json
```

Fixture results are labeled `offline-fixture` and describe harness and policy behavior. They are not Jev performance measurements. Generated JSON and Markdown reports are ignored by Git.

Live evaluation is sequential, requires an explicit confirmation flag and `TYPESAFE_API_KEY`, and may incur charges. Use a small limit only after explicit authorization:

```bash
npm run eval -- --mode live --confirm-live --limit 1
```

See [Evaluation and benchmarking](docs/evaluation.md), the [evaluation assets](evals/README.md), and the [annotation guide](evals/annotation-guide.md).

## Web playground

The independent `web/` package provides a dark, responsive issue-analysis workbench and a compact evaluation view. Its three synthetic scenarios use authored example values, then run the real deterministic policy and label mapper locally. They do not call Jev and do not represent model performance.

```bash
npm ci
npm --prefix web ci
npm --prefix web run dev
```

Open `http://localhost:3000`. Live Jev mode remains disabled unless a local developer explicitly sets both the server-only opt-in and credential in ignored `web/.env.local`. Production live access is rejected. See the [web application guide](web/README.md) for the exact configuration and independent checks.

## Repository roles

This `jevflow` repository contains the application source and documentation. The separate `jevflow-test-repo` is disposable and reserved for explicitly authorized integration and evaluation runs; it must not be merged into this repository.

## Documentation

- [Architecture](docs/architecture.md)
- [Technical decisions](docs/decisions.md)
- [Development guide](docs/development.md)
- [Evaluation and benchmarking](docs/evaluation.md)
- [Roadmap](docs/roadmap.md)
- [Web playground](web/README.md)
