# JevFlow

Confidence-aware GitHub issue triage powered by TypeSafe AI Jev.

JevFlow is being built to help maintainers classify incoming GitHub issues, evaluate decision confidence, and route uncertain or security-sensitive cases to a human. The planned flow is GitHub issue input → Jev typed decisions → normalized results → deterministic confidence policy → proposed labels or human review → GitHub automation.

## Current status

Tasks 01 and 02 provide the runnable foundation and Jev triage engine:

- Node.js 20+ with strict TypeScript ESM
- canonical issue classification vocabulary and input type
- validated environment configuration
- an offline bootstrap CLI
- formatting, linting, tests, build, and CI configuration
- bounded runtime validation for untrusted issue input
- five typed questions submitted in one official Jev SDK call
- strict provider-response normalization through `analyzeIssue`

The deterministic confidence policy, GitHub mutations, and optional dashboard remain planned for later phases. The regular bootstrap and validation commands do not make network requests.

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

## Repository roles

This `jevflow` repository contains the application source and documentation. The separate `jevflow-test-repo` is disposable and reserved for explicit GitHub automation tests in Task 04; it must not be merged into this repository.

## Documentation

- [Architecture](docs/architecture.md)
- [Technical decisions](docs/decisions.md)
- [Development guide](docs/development.md)
- [Roadmap](docs/roadmap.md)
