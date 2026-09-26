# Changelog

All notable changes to JevFlow will be documented in this file. The format follows Keep a Changelog principles; the project does not yet claim Semantic Versioning compatibility.

## [0.1.0] - Draft

### Added

- Strict TypeScript ESM foundation with environment validation, offline bootstrap, formatting, linting, tests, build, and CI.
- Official TypeSafe AI Jev SDK integration with three typed choice questions, two binary P(YES) questions, bounded issue state, and strict normalized results.
- Deterministic confidence policy with critical, security, human-review, and truncation escalation.
- Human-readable and JSON local triage CLI with static allowlisted label proposals.
- Repository-verified GitHub event parser, narrow Octokit adapter, idempotent label reconciliation, sticky security review, fallback behavior, and Actions summaries.
- Source-repository workflow and configurable public-source target-repository template.
- Versioned 30-case synthetic dataset, offline fixture evaluator, optional gated live mode, metrics, and JSON/Markdown reporting.
- Responsive Next.js dashboard with three synthetic previews, distinct confidence visualization, proposed labels, and a read-only evaluation view.
- Architecture, development, testing, evaluation, security, deployment, demo, and release-readiness documentation.

### Security

- Kept provider and GitHub credentials server-side and out of committed environment files.
- Bounded untrusted issue, event, request, and local report input.
- Restricted GitHub permissions and label names; pinned workflow actions by immutable SHA.
- Disabled dashboard live inference by default and in production.

### Fixed

- Kept manual workflow dispatch input as data in the concurrency key so malformed input reaches the application's validated error path instead of failing in `fromJSON` expression evaluation.
- Removed target-repository instructions for seed scripts that are not part of the JevFlow source repository.

### Known limitations

- Live Jev performance, cost, and provider latency have not been measured for this release candidate.
- GitHub-hosted issue labeling and the disposable target workflow have not been observed live.
- No public dashboard is deployed; the live dashboard API is development-only.
- Synthetic fixture metrics do not measure Jev accuracy or calibration.
- License, public URLs, tag, GitHub release, push, and deployment remain pending owner decisions and authorization.
