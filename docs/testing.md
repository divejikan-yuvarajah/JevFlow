# Testing and Verification

## Offline test matrix

| Surface            | Command                                     | Expected observation                                              |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| Root formatting    | `npm run format:check`                      | Project-owned files match Prettier                                |
| Root types         | `npm run typecheck`                         | Strict TypeScript exits zero                                      |
| Root lint          | `npm run lint`                              | Source, tests, scripts, and ESLint config pass                    |
| Root tests         | `npm test`                                  | Vitest runs only `tests/**/*.test.ts` without network             |
| Root build         | `npm run build`                             | ESM output and declarations appear in ignored `dist/`             |
| Full root check    | `npm run check`                             | All five root checks pass in sequence                             |
| Bootstrap          | `npm run dev`, then `npm start` after build | Product/foundation text prints and the process exits without keys |
| CLI help           | `npm run triage -- --help`                  | Usage prints without constructing a provider                      |
| Evaluation help    | `npm run eval -- --help`                    | Modes and live confirmation requirement print                     |
| Fixture evaluation | `npm run eval -- --mode fixture`            | 30 synthetic cases, `offline-fixture`, Jev latency `N/A`          |
| Web install        | `npm --prefix web ci`                       | Independent web lockfile installs exactly                         |
| Web check          | `npm --prefix web run check`                | Format, types, lint, tests, root build, and Next build pass       |

Fresh-install verification uses `npm ci` at the root and in `web/`. Generated output is ignored. Do not delete user files or run a live provider command to prove a clean install.

## Covered regression behavior

The root suite covers:

- empty, malformed, and oversized issue input; bounded Unicode title/body handling;
- all five typed questions, one analyzer invocation, response validation, and missing probability rejection;
- exact choice threshold boundaries, selected probability versus reported confidence, and binary P(YES);
- critical, security, human-review, and truncation escalation;
- allowlisted labels, withheld speculative categories, sticky security review, preserved human labels, and idempotent reconciliation;
- wrong repository, pull request, unsupported event, invalid dispatch, provider fallback, and partial GitHub operations;
- 30-case dataset/fixture integrity, zero denominators, report provenance, live confirmation gate, and sanitized case failures;
- immutable workflow references, narrow triggers and permissions, safe dispatch concurrency data, and target template placeholders.

The web suite covers:

- public API contract validation and selected probability/confidence/P(YES) separation;
- preview provenance and exact sample matching;
- empty, loading, invalid, unavailable, success, and sanitized provider-error states;
- disabled default and production live route, request size/content checks, and no analyzer call for rejected requests;
- shared core policy and label mapping instead of copied application logic;
- safe local evaluation report loading and an honest missing-report state.

All tests use injected providers and GitHub adapters. They make no live Jev or GitHub API request.

## Manual browser plan

Run `npm --prefix web run dev`, then inspect `http://localhost:3000` and `/evaluation` at desktop and narrow mobile widths.

1. Confirm the landing page and form render with visible keyboard focus.
2. Run each unmodified synthetic scenario and confirm the result says `SYNTHETIC PREVIEW — not a Jev result`.
3. Edit sample text in Preview Fixture mode and confirm the UI refuses to present a fixture decision.
4. Check that selected probability, reported choice confidence, and both P(YES) measures use distinct labels.
5. Confirm proposed labels are described as previews and no network analysis request occurs in preview mode.
6. Confirm `/evaluation` displays the newest valid local report with provenance or the documented empty state.
7. Exercise empty, over-limit, reset, unavailable-live, and error states with keyboard navigation.
8. Inspect browser source/network responses for issue-body echo or credential-shaped values.

Record browser, viewport, date, observed result, and real screenshot path. If no browser tooling is available, report the check as **NOT RUN**.

## Optional authorized live plan

Live verification is separate from offline QA and may incur cost.

1. Obtain explicit authorization for the exact provider call count.
2. Use a dedicated limited key in ignored local configuration.
3. Start with one benign synthetic input through the CLI or local development dashboard.
4. Record timestamp, SDK/package version, mode, sanitized success/failure, and provider latency only when actually observed.
5. For GitHub, follow `docs/deployment.md` and begin with one issue in the disposable repository.
6. Revoke or rotate temporary credentials and remove local configuration when testing is complete.

Never promote fixture metrics to live results or add a private issue body to a report.
