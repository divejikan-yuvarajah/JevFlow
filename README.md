# JevFlow

Confidence-aware GitHub issue triage powered by TypeSafe AI Jev.

JevFlow is being built to help maintainers classify incoming GitHub issues, evaluate decision confidence, and route uncertain or security-sensitive cases to a human. The planned flow is GitHub issue input → Jev typed decisions → normalized results → deterministic confidence policy → proposed labels or human review → GitHub automation.

## Current status

Tasks 01–04 provide the runnable foundation, Jev triage engine, deterministic confidence policy, and secure GitHub automation:

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

The automation can mutate labels only when the guarded Actions runner receives a supported, validated event and repository-scoped credentials. No live workflow has been deployed or tested as part of the offline implementation. The optional dashboard remains planned for a later phase. The regular bootstrap, validation commands, and CLI help do not make network requests.

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

## Repository roles

This `jevflow` repository contains the application source and documentation. The separate `jevflow-test-repo` is disposable and reserved for explicitly authorized integration and evaluation runs; it must not be merged into this repository.

## Documentation

- [Architecture](docs/architecture.md)
- [Technical decisions](docs/decisions.md)
- [Development guide](docs/development.md)
- [Roadmap](docs/roadmap.md)
