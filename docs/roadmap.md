# JevFlow Roadmap

## Project goal

JevFlow will provide confidence-aware GitHub issue triage powered by TypeSafe AI Jev. OpenAI Codex is the development assistant; Jev is the runtime inference provider. JevFlow will combine Jev's typed decisions with deterministic confidence policy and, later, GitHub automation.

## High-level architecture

```text
GitHub Issue Opened
        ↓
GitHub Actions
        ↓
Issue Event Parser
        ↓
JevFlow Issue State Builder
        ↓
TypeSafe AI Jev
        ↓
Typed Decisions
        ↓
Confidence Policy Engine
        ↓
GitHub Labels / Human Review
        ↓
Triage Summary
```

Codex assists with development only. Jev remains the application's inference provider; Jev must not be replaced with OpenAI API calls.

## Development phases

| Phase                                                 | Scope                                                                                                                           | Target branch             | Status      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ----------- |
| Setup Phase                                           | VS Code + Codex workflow, repository instructions, prompts, roadmap, Git conventions, workspace verification                    | `main`                    | Complete    |
| Task 01 — Project Foundation & Configuration          | Node.js 20+, TypeScript ESM, npm, environment configuration, domain types, quality tooling, tests, CI, bootstrap CLI, base docs | `feat/project-foundation` | Complete    |
| Task 02 — Jev Integration & Intelligent Triage Engine | Jev SDK, issue state, typed questions, analysis, validation, normalized output, optional smoke test                             | `feat/jev-engine`         | Complete    |
| Task 03 — Confidence Policy, Labels & CLI             | Confidence thresholds, decision modes, escalation, label mapping, local CLI, fail-safe behavior                                 | `feat/confidence-policy`  | Complete    |
| Task 04 — GitHub Integration & Automation             | Event parsing, GitHub API, labels, automation, Actions workflow, summaries, test-repository deployment template                 | `feat/github-automation`  | Complete    |
| Task 05 — Testing, Evaluation & Benchmarking          | Evaluation data, fixtures, accuracy, latency, confidence, automation coverage, review escalation metrics                        | `test/evaluation-suite`   | Not Started |
| Task 06 — Web Playground & Decision Dashboard         | Optional Next.js UI, issue input, server-side Jev path, decision and confidence/policy views, responsive layout                 | `feat/demo-dashboard`     | Not Started |
| Task 07 — Documentation, Final QA & Release           | README, architecture docs, screenshots, demos, release checklist, security review, release and demo preparation                 | `docs/release`            | Not Started |

## Current status

- Setup Phase: Complete
- Task 01: Complete
- Task 02: Complete
- Task 03: Complete
- Task 04: Complete (offline implementation and validation; live deployment not run)
- Task 05: Not Started
- Task 06: Not Started
- Task 07: Not Started

The foundation, Jev triage engine, confidence policy, label proposal mapper, local CLI, and guarded GitHub automation have been implemented and verified offline. The main workflow and separately configurable target-repository template are present. Live Jev inference, workflow deployment, and GitHub issue mutation were not run.

## Repository separation

The main `jevflow` repository contains source, Jev integration, policy, GitHub automation, tests, documentation, and the optional dashboard. The separate `jevflow-test-repo` is disposable and used only for sample issues and explicit real-world automation testing. Never merge the test repository into the main source repository.
