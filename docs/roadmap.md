# JevFlow Roadmap

## Project goal

JevFlow provides a locally verified confidence-aware GitHub issue triage MVP powered by TypeSafe AI Jev. OpenAI Codex is the development assistant; Jev is the runtime inference provider. JevFlow combines Jev's typed decisions with deterministic confidence policy and guarded GitHub automation.

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

| Phase                                                 | Scope                                                                                                                           | Target branch                 | Status           |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ---------------- |
| Setup Phase                                           | VS Code + Codex workflow, repository instructions, prompts, roadmap, Git conventions, workspace verification                    | `main`                        | Complete         |
| Task 01 — Project Foundation & Configuration          | Node.js 20+, TypeScript ESM, npm, environment configuration, domain types, quality tooling, tests, CI, bootstrap CLI, base docs | `feat/project-foundation`     | Complete         |
| Task 02 — Jev Integration & Intelligent Triage Engine | Jev SDK, issue state, typed questions, analysis, validation, normalized output, optional smoke test                             | `feat/jev-engine`             | Complete         |
| Task 03 — Confidence Policy, Labels & CLI             | Confidence thresholds, decision modes, escalation, label mapping, local CLI, fail-safe behavior                                 | `feat/confidence-policy`      | Complete         |
| Task 04 — GitHub Integration & Automation             | Event parsing, GitHub API, labels, automation, Actions workflow, summaries, test-repository deployment template                 | `feat/github-automation`      | Complete         |
| Task 05 — Testing, Evaluation & Benchmarking          | Evaluation data, fixtures, accuracy, latency, confidence, automation coverage, review escalation metrics                        | `test/evaluation-suite`       | Complete         |
| Task 06 — Web Playground & Decision Dashboard         | Optional Next.js UI, issue input, server-side Jev path, decision and confidence/policy views, responsive layout                 | `feat/demo-dashboard`         | Complete         |
| Task 07 — Documentation, Final QA & Release           | README, architecture docs, screenshot plan, demo kit, release checklist, security review, release and demo preparation          | `docs/release`                | Complete locally |
| Post-release — Connected Repositories                 | Read-only public repository metadata/issues, local links, filtering, details, and playground handoff                            | `feat/connected-repositories` | Complete locally |

## Current status

- Setup Phase: Complete
- Task 01: Complete
- Task 02: Complete
- Task 03: Complete
- Task 04: Complete (offline implementation and validation; live deployment not run)
- Task 05: Complete (offline synthetic evaluation; live Jev benchmark not run)
- Task 06: Complete (offline playground and guarded local live path; no live request run)
- Task 07: Complete locally (offline QA and release preparation; publication pending)
- Connected Repositories enhancement: Complete locally (offline verified; real public read smoke test not run)

The foundation, Jev triage engine, confidence policy, label proposal mapper, local CLI, guarded GitHub automation, 30-case evaluation harness, responsive local dashboard, Task 07 release documentation, and post-release public repository browser have been implemented and verified offline. The dashboard provides three explicit synthetic previews, a local-development-only Jev route, a read-only view of valid Task 05 reports, and server-side public GitHub issue browsing with a no-inference playground handoff. Evaluation and preview data clearly identify authored fixtures and do not claim live Jev performance. Live Jev inference, live benchmarking, a real public-repository read smoke test, workflow deployment, GitHub issue mutation, public hosting, screenshots, tags, and release publication were not run. License selection remains pending.

## Repository separation

The main `jevflow` repository contains source, Jev integration, policy, GitHub automation, tests, documentation, and the optional dashboard. The separate `jevflow-test-repo` is disposable and used only for sample issues and explicit real-world automation testing. Never merge the test repository into the main source repository.
