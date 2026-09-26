# JevFlow — Codex Repository Instructions

## Project

JevFlow is a confidence-aware GitHub issue triage system powered by TypeSafe AI Jev.

OpenAI Codex is used only as the software development assistant.

TypeSafe AI Jev is the runtime inference provider.

Never replace Jev with the OpenAI API.

## Working Rules

Before modifying code:

1. Inspect the existing repository.
2. Read relevant existing files.
3. Review `git status`.
4. Preserve all completed functionality.
5. Execute only the explicitly requested development phase.

Do not implement later phases early.

Do not rebuild working modules unnecessarily.

## Architecture Principles

Keep these layers separate:

- domain types
- Jev integration
- triage normalization
- deterministic policy
- GitHub side effects
- presentation/dashboard

Do not mix GitHub API calls into Jev inference code.

Do not mix confidence-policy logic into UI code.

Do not duplicate canonical enums or label definitions.

Prefer small typed modules over large files.

## TypeScript

Use strict TypeScript.

Avoid `any` unless absolutely unavoidable and documented.

Prefer:

- explicit domain types
- discriminated unions where useful
- immutable constants
- dependency injection for side-effect services
- pure functions for policy and normalization
- ESM-safe imports

## Secrets

Never commit:

- API keys
- tokens
- `.env`
- credentials
- GitHub PATs

Never print secret values in logs.

Use `.env.example` with placeholders only.

## Git

Use one feature branch per development phase.

Never use destructive Git commands automatically.

Never force push.

Never discard existing uncommitted changes.

Before merging:

- run all available validation commands
- inspect the diff
- confirm no secrets were added
- ensure unrelated files were not modified

## Validation

When scripts exist, run the relevant checks:

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

Prefer a project-wide:

```bash
npm run check
```

when available.

Fix failures introduced by the current task.

Do not hide failures by weakening configuration.

## Development Roadmap

Execute only one phase at a time:

1. Project Foundation & Configuration
2. Jev Integration & Intelligent Triage Engine
3. Confidence Policy, Labels & CLI
4. GitHub Integration & Automation
5. Testing, Evaluation & Benchmarking
6. Web Playground & Decision Dashboard
7. Documentation, Final QA & Release

## External Test Repository

`jevflow-test-repo` is a separate disposable repository.

Never treat it as the main JevFlow source repository.

Never merge it into this repository.

Only use it during explicit GitHub automation testing.

## Final Report for Every Task

At the end of each task report:

1. Files created and modified
2. Main functionality implemented
3. Validation commands executed
4. Actual test/build results
5. Git branch
6. Commit hash if committed
7. Merge status
8. Remaining blockers
9. Exact next development phase

Never claim work that was not actually performed.
