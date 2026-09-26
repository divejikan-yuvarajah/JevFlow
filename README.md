# JevFlow

Confidence-aware GitHub issue triage powered by TypeSafe AI Jev.

JevFlow is being built to help maintainers classify incoming GitHub issues, evaluate decision confidence, and route uncertain or security-sensitive cases to a human. The planned flow is GitHub issue input → Jev typed decisions → normalized results → deterministic confidence policy → proposed labels or human review → GitHub automation.

## Current status

Task 01 provides the runnable project foundation:

- Node.js 20+ with strict TypeScript ESM
- canonical issue classification vocabulary and input type
- validated environment configuration
- an offline bootstrap CLI
- formatting, linting, tests, build, and CI configuration

Jev inference, confidence policy, GitHub mutations, and the optional dashboard are planned for later phases. The current bootstrap does not classify issues or make network requests.

## Requirements

- Node.js 20.19 or newer
- npm

## Get started

```bash
npm install
```

Optionally create local environment settings from `.env.example`. No TypeSafe API key is needed for Task 01.

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

## Repository roles

This `jevflow` repository contains the application source and documentation. The separate `jevflow-test-repo` is disposable and reserved for explicit GitHub automation tests in Task 04; it must not be merged into this repository.

## Documentation

- [Architecture](docs/architecture.md)
- [Technical decisions](docs/decisions.md)
- [Development guide](docs/development.md)
- [Roadmap](docs/roadmap.md)
