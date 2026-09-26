# JevFlow v0.1.0 Release Readiness Report

Date: 2026-09-27 (Asia/Colombo)

Baseline commit reviewed: `073da2755f918e7301e0473761a2723aca3d49a6`

Branch: `docs/release`

## Inventory

- Correct repository: main JevFlow source at `C:\Users\ASUS\Desktop\My Learning Projects\JevFlow`; the separate `jevflow-test-repo` was not opened or changed.
- Setup and Tasks 01–06 are present in Git history and in the implemented source/tests.
- Root CLI: **YES**, `src/cli/` with offline bootstrap, local triage, evaluation, and guarded Actions entry points.
- Runtime inference: **YES**, official `@typesafe-ai/sdk` 0.6.0 through the single lazy adapter in `src/jev/client.ts`.
- Policy and labels: **YES**, one deterministic policy in `src/policy/` and one catalog/mapper in `src/github/labels.ts`.
- GitHub automation: **YES**, guarded event parsing, narrow API adapter, reconciliation, runner, and summary under `src/github/`.
- Evaluator: **YES**, 30 synthetic cases, 30 authored normalized fixtures, metrics, and report renderer under `src/evaluation/` and `evals/`.
- Dashboard: **YES**, independent Next.js 16.3.6 package under `web/`, with synthetic preview, guarded local route, and evaluation summary.
- Version: root and web packages both declare `0.1.0`; changelog entry remains a draft because no tag or release exists.
- License: **NO LICENSE FILE**. Selection remains with the project owner.

## Integration audit

The observed application flow is:

```text
bounded issue input
  → official Jev typed questions
  → strict TriageResult normalization
  → deterministic confidence/review policy
  → static allowlisted label proposal
  → local/web display OR repository-scoped GitHub reconciliation
```

Confirmed contracts:

- Choice selected probability and provider-reported confidence stay separate from each other and from binary P(YES).
- Provider response normalization rejects missing/invalid data and does not invent probability defaults.
- Critical priority, security P(YES), needs-review P(YES), and truncation only escalate review.
- Human-review output does not receive speculative category labels. `security-review` requests investigation, stays sticky, and does not claim a vulnerability.
- GitHub fallback for a trusted issue adds human review without fabricating classifications; unrelated labels remain.
- CLI, GitHub, evaluation, and dashboard adapters reuse the same analyzer, policy, and label mapper.
- Preview fixtures and Task 05 artifacts carry synthetic provenance. Web page load/build/preview do not invoke Jev.
- The live web route is server-only, off by default, disabled in production, request-bounded, and read-only with respect to GitHub.

Task 07 fixed two factual integration defects:

1. Both issue workflows previously called `fromJSON(inputs.issue_number)` in the concurrency expression. Malformed manual input could fail before the guarded runner validated it. The concurrency key now treats the input as data and the existing parser remains the authority; the workflow contract test prevents regression.
2. The target-repository guide referenced seed scripts and sample assets that are not in this source repository. The guide now accurately explains that the workflow creates missing allowlisted labels and recommends one synthetic issue at a time.

The offline bootstrap also had a stale “Next phase: Task 07” line. It now reports Tasks 01–07 as locally implemented while clearly stating that live Jev, GitHub deployment, and public release are unverified; its unit test was updated.

## Offline validation

Environment observed: Node.js `v24.10.0`, npm `11.6.1`. The project requires Node.js 20.19 or newer and CI selects Node 20.

| Check                  | Status  | Evidence                                                                                   |
| ---------------------- | ------- | ------------------------------------------------------------------------------------------ |
| Root `npm ci`          | PASS    | 214 packages installed; npm reported 0 vulnerabilities                                     |
| Root format            | PASS    | `npm run format:check`; all matched files formatted                                        |
| Root typecheck         | PASS    | `npm run typecheck`; strict TypeScript exited 0                                            |
| Root lint              | PASS    | `npm run lint`; exited 0                                                                   |
| Root tests             | PASS    | `npm test`; 25 files, 222 tests passed                                                     |
| Root build             | PASS    | `npm run build`; `tsc -p tsconfig.build.json` exited 0                                     |
| Root combined check    | PASS    | `npm run check`; format, types, lint, 222 tests, and build passed                          |
| Bootstrap source       | PASS    | `npm run dev`; offline status printed and process exited 0                                 |
| Bootstrap compiled     | PASS    | `npm start` after build; offline status printed and process exited 0                       |
| Triage CLI help        | PASS    | `npm run triage -- --help`; usage printed without provider request                         |
| Evaluation CLI help    | PASS    | `npm run eval -- --help`; fixture/live gates and output options printed                    |
| Fixture evaluation     | PASS    | 30/30 succeeded, 0 failed, 0 skipped; mode `offline-fixture`, provider `synthetic-fixture` |
| Web `npm ci`           | PASS    | 575 packages installed; npm reported 0 vulnerabilities                                     |
| Web typecheck          | PASS    | root prebuild, Next typegen, and `tsc --noEmit` exited 0                                   |
| Web lint               | PASS    | `eslint . --max-warnings=0` exited 0                                                       |
| Web tests              | PASS    | 9 files, 43 tests passed                                                                   |
| Web build              | PASS    | Next production build succeeded for `/`, `/evaluation`, and `/api/analyze`                 |
| Web combined check     | PASS    | `npm --prefix web run check`; format, types, lint, 43 tests, and build passed              |
| Local HTTP smoke       | PASS    | `/` 200, `/evaluation` 200, disabled POST 503, API GET 405 with `Allow: POST`              |
| Browser desktop/mobile | NOT RUN | Computer-use state exposed no apps or browsers; no screenshots were fabricated             |

Total deterministic tests observed: **265** (222 root plus 43 web).

The first sandboxed `npm ci` attempt hit Windows `EPERM` while accessing the user npm cache; the approved host-context rerun passed. After the fresh install, sandboxed `tsx` commands hit a host `uv_os_get_passwd` `ENOMEM` error before application code; the same offline commands passed outside that sandbox boundary. These are recorded environment/tooling events, not hidden test passes.

The web fresh install emitted npm's deprecation warning for ESLint 9.39.5. The audit found no vulnerability and current `eslint-config-next` declares ESLint `>=9`; moving the web package to ESLint 10 is a non-blocking maintenance item that was not mixed into release QA.

## Fixture evaluation evidence

Generated ignored artifacts:

- `evals/results/task07-offline-20260927.json`
- `evals/results/task07-offline-20260927.md`

Observed authored-fixture results:

| Metric                      |         Result |
| --------------------------- | -------------: |
| Issue type strict           |  29/30 (96.7%) |
| Engineering area strict     |  26/30 (86.7%) |
| Engineering area acceptable |  29/30 (96.7%) |
| Priority strict             |  27/30 (90.0%) |
| Exact all three             |  23/30 (76.7%) |
| Automation coverage         |  12/30 (40.0%) |
| Review-required capture     | 13/13 (100.0%) |
| False-auto annotated cases  |              0 |

These are deterministic results from human-authored synthetic normalized decisions. They measure the fixture harness, annotations, policy, and reporting behavior. They are **not actual Jev accuracy, calibration, provider latency, cost, or production performance**. Jev provider latency is `N/A` in the report.

## Security and workflow review

- Secret handling: `.env`, web environment files, generated reports, builds, logs, and dependencies are ignored. Tracked environment examples contain placeholders. A pattern scan found no credential-shaped tracked value; one web documentation placeholder and a `sk-` substring in instructional text were reviewed as false positives.
- Client isolation: the built client static assets contained zero files matching `TYPESAFE_API_KEY`, `GITHUB_TOKEN`, `NEXT_PUBLIC_`, `@typesafe-ai`, or the test placeholder.
- Input safety: issue state, event files, dashboard requests, and evaluation reports have explicit size and schema limits. Issue text is not interpolated into shell commands or workflow refs.
- GitHub scope: triage workflows request only `contents: read` and `issues: write`. CI requests only `contents: read`. No workflow uses `pull_request_target`, `write-all`, label/edit loops, or issue comments.
- Action supply chain: `actions/checkout` is pinned to commit `3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1), and `actions/setup-node` to `820762786026740c76f36085b0efc47a31fe5020` (v7.0.0). These releases and commits were checked against the official action release pages on 2026-09-27.
- Target separation: the target template requires an explicit public owner and full source commit SHA and runs under the target repository's event, secret, and automatic token.
- Dependency audit: both fresh installs reported 0 vulnerabilities. This is a time-bound npm advisory result, not a security certification.

Known security limits are documented in `docs/security.md`: probabilistic output, third-party issue processing, no public-route authentication/rate limit design, no live Actions evidence, and no private security-reporting channel selected.

## External status

| Activity                             | Status   | Evidence                                           |
| ------------------------------------ | -------- | -------------------------------------------------- |
| Workflow template reviewed locally   | PASS     | YAML, contract tests, permission/pin/static review |
| Installed on target default branch   | NOT DONE | No target repository mutation authorized           |
| Live Jev inference or benchmark      | NOT RUN  | No paid/live authorization provided                |
| Actual GitHub issue labeling         | NOT RUN  | No remote issue mutation authorized                |
| Public web deployment                | NOT DONE | No hosting action authorized                       |
| Git push, tag, PR, or GitHub release | NOT DONE | Publication explicitly excluded from Task 07       |

A local workflow review and injected API tests are not equivalent to a GitHub-hosted Actions run.

## Release blockers and pending actions

1. **License:** owner must choose and add a license before public reuse terms are clear.
2. **Public identity:** confirm repository visibility, final repository/demo URLs, contribution expectations, and a private security contact.
3. **Visual QA:** perform and record desktop/mobile browser inspection; capture genuine screenshots if desired.
4. **Live verification:** decide whether to authorize one benign Jev request and one disposable target issue run. Keep any result separate from fixture metrics.
5. **Publication:** explicitly authorize remote push, tag/release creation, and any hosting only after reviewing the merged commit.
6. **Maintenance:** plan a web ESLint 10 upgrade separately from this validated release branch.

No unresolved offline code, test, build, secret-leak, or workflow-contract blocker was observed.

## Outcome

- **Offline MVP: READY.** Root and web fresh installs, 265 tests, builds, CLIs, fixture evaluation, secret/client scans, and localhost route checks passed.
- **Live verified: NO.** No paid Jev request, GitHub-hosted target run, real issue label mutation, or public hosting was performed.
- **Public release: PENDING BLOCKERS.** License and public project details are unresolved, visual/live checks remain optional but unperformed, and publication requires explicit owner authorization.
