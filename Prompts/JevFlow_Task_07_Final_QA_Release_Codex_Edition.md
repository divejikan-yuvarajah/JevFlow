# JevFlow — Task 07: Documentation, Final QA & Release (Codex Edition)

> **Complete execution prompt for VS Code + OpenAI Codex — EXECUTE TASK 07 ONLY.**  
> Product: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**  
> Roadmap: **Phase 7 of 7**, after Setup and Tasks 01–06  
> Feature branch: **`docs/release`**  
> Expected stack: Node.js 20+, npm, strict TypeScript ESM, official TypeSafe AI Jev SDK, Vitest, GitHub Actions/REST, and optional Next.js web playground in `web/`  
> **Codex is the development agent. TypeSafe AI Jev remains the application's runtime inference provider.**

---

## 0. Mission and definition of done

Act as the project's senior release engineer, technical writer, TypeScript reviewer, GitHub Actions security reviewer and QA lead inside **VS Code using the OpenAI Codex extension**. Read `AGENTS.md` and this complete prompt. Inspect what really exists before changing files; do not assume every prior task has been implemented exactly as an illustrative directory tree suggested.

**Goal:** Turn the existing JevFlow MVP into a verifiable, well-documented, responsibly packaged public-project candidate. Fix release-blocking defects within the established architecture, run the full **offline** source + dashboard validation, produce clear installation/testing/demo/release instructions, and write a factual release-readiness report. Commit safely and merge only when validation supports it.

**Offline completion does not require publishing:** It is possible to finish Task 07 locally even with no TypeSafe key, GitHub login, public repository, live benchmark, screenshots or deployment. Mark unperformed external checks **NOT RUN**, with a practical verification procedure; never label them PASS.

### What this phase owns

- Final cross-phase integration audit and minimal fixes for demonstrated defects.
- README, setup, configuration, usage, architecture, security and limitation documentation.
- Honest offline-versus-live evaluation presentation and reproducibility guidance.
- Review and hardening of GitHub workflows and test-repo deployment instructions.
- Core/web test, typecheck, format, lint, build and CLI verification.
- Demo scenario pack, screenshot/recording plan and release notes.
- Final release-readiness checklist/report with observed evidence.
- Safe Git feature branch, commit, merge and final verification.

### Deliberately excluded without separate user approval

- **Do not** invoke paid/live Jev inference, seed or mutate real GitHub issues, publish a repo, push to a remote, create a GitHub release/tag, deploy a public website, change production secrets, or open a pull request automatically.
- Do not substitute an OpenAI inference service for Jev or redesign its SDK/questions to improve reported metrics.
- Do not introduce a database, authentication platform, billing, Slack, PR triage, new product features or another dashboard framework.
- Do not manufacture a demo screenshot, dashboard metric, measured latency, accuracy number, customer quote or live success claim.
- Do not alter the separate `jevflow-test-repo` unless explicit permission and access are independently supplied. In this phase only document the installation and testing flow.

---

## 1. Mandatory preflight: actual repository first

Read all present and relevant files, adjusting names to the actual code:

```text
AGENTS.md
prompts/README.md
prompts/task-01-project-foundation.md ... task-06-dashboard.md (if available)
README.md
package.json, package-lock.json, tsconfig*.json, .env.example, .gitignore
.github/workflows/ci.yml
.github/workflows/jevflow-triage.yml
deploy/target-repo/jevflow-triage.yml
deploy/target-repo/README.md
docs/roadmap.md, architecture.md, decisions.md, development.md, codex-workflow.md
docs/evaluation.md, docs/security.md (if present)
src/domain/, src/config/, src/jev/, src/triage/, src/policy/, src/github/, src/cli/
tests/, examples/, scripts/, evals/
web/package.json, web/package-lock.json, web/app/, web/src/ or actual layout
all existing test and generated-report schemas
```

Inspect rather than assuming names or exports. Determine whether `web/` is a separate npm app or workspace; read its actual lockfile/scripts. Determine which Task 05 files are committed source/fixtures versus generated ignored outputs.

Run safe, platform-appropriate commands (PowerShell equivalents are fine):

```bash
pwd
git status --short
git branch -a
git log --oneline -7
git remote -v
node --version
npm --version
npm run check
```

If `web/` exists and its package defines a check script, also run `npm --prefix web run check`. Record baseline failures **before editing**.

### Preflight gates

1. Confirm you are in the **main JevFlow source repository**. If the workspace is `jevflow-test-repo`, STOP without editing.
2. Confirm Setup and Tasks 01–06 have been implemented or determine the exact missing phase/feature. Task 06 is optional in the general roadmap, but for this run verify its actual status and document limitations if absent. Do **not** claim a web UI exists when it does not.
3. Verify actual runtime contracts and existing scripts; don't manufacture new exports/paths based on this prompt.
4. Preserve all user files and uncommitted work. Never run `git reset --hard`, `git clean -fd`, force-push or silent stash; do not broadly reformat long user-supplied prompt files.
5. Treat locally configured keys as secrets. Do not open/print `.env` or copy provider error bodies into the report.
6. If a release-critical earlier phase is incomplete or its baseline checks fail, document the blocker and repair only a safe, related defect. Don't falsely call the release ready merely because docs look polished.

---

## 2. Git workflow for final phase

Use exactly:

```text
docs/release
```

Start from a verified `main` with the prior completed phases merged. If the branch already exists, inspect/reuse safely. Only pull a verified intended upstream via `git pull --ff-only` if safe. Do not automatically push, tag or publish.

Illustrative sequence (adapt to actual state):

```bash
git status
git switch main
# git pull --ff-only  # only if a known intended upstream exists and the tree is safe
git switch -c docs/release
npm run check
```

If Git is dirty or a prior task has unmerged work, preserve it, report it and avoid unsafe switching. Perform Task 07 on its branch; review changes, commit only relevant files, then merge normally to `main` **only after all applicable required checks pass**. Re-run checks on merged main. Never invent a commit hash or merge result.

---

## 3. Product contract to preserve

Expected (actual exports are authoritative) pipeline:

```text
Issue input / GitHub issue event
  → bounded, validated Jev state
  → official TypeSafe AI Jev typed questions
  → validated TriageResult
  → deterministic confidence/review policy
  → allowlisted label proposals
  → GitHub reconciliation/actions OR read-only local/web presentation
```

- Three choices: `issueType`, `engineeringArea`, `priority`.
- Two binary YES probabilities: `securitySensitive`, `needsHumanReview`.
- `selectedProbability` (P of selected choice) and provider-reported `confidence` are **separate**. Binary `probabilityYes` is **P(YES)**, not generic confidence or proof of wrongdoing.
- Task 03's conservative choice gate and safety overrides are its own application policy; don't claim provider guarantees or certified calibration.
- Exactly one existing analyzer/policy/label mapper is reused across CLI, workflow and web. No duplicate classifiers in documentation examples or UI.
- `security-review` means **manual review recommended**, not a verified security incident. Once added on GitHub it stays sticky per Task 04's implementation unless a human removes it.
- Task 04 event workflow runs **inside the repository receiving issues**; its repo-scoped `GITHUB_TOKEN` cannot be assumed to label another repository.
- Task 06 preview/demo is synthetic; server-side live calls require explicit configuration and opt-in. Web UI must not mutate GitHub.
- Task 05 offline fixture metrics are not actual Jev inference accuracy, latency or calibration.

Document implementation deviations precisely rather than rewriting verified code to match the examples above. No threshold tuning or sample-label cherry-picking to make a release graph look better.

---

## 4. Release-blocker audit and minimal integration fixes

Trace at least these actual paths and verify their contracts:

| Path | Required observation |
|---|---|
| Root bootstrap CLI | Runs with no keys, truthful foundation/product output |
| Local triage CLI `--help` | No network/inference; parameters and error behavior accurate |
| Existing Jev adapter | Official SDK isolated server-side; no import-time request/key requirement |
| Triage normalization | Validates response; never fills unknown model probabilities with invented defaults |
| Confidence policy | Deterministic; respects selected probability, reported confidence and P(YES) semantics |
| Label proposal | Strict canonical allowlist; human-review doesn't add speculative category labels |
| GitHub runner | Trusted issue identity, preserved human labels, sticky security review, truthful partial/fallback results |
| GitHub workflows | Correct triggers, repository scope and least privilege |
| Offline evaluator | Exactly the intended synthetic cases and explicit `offline-fixture`/equivalent provenance |
| Optional live evaluator | Explicit confirmation and prior user approval; no automatic provider call |
| Web preview | Fixture-mode provenance visibly shown; no live call from page load/build/preview |
| Web live API | Server-only, disabled by default and protected from unauthenticated public misuse |
| README/commands | Every copied command reflects real package scripts and paths |

Repair only concrete integration defects discovered. Add a regression test for each substantive behavioral fix. Do not make unrelated architectural rewrites. If a defect is high-impact and cannot be safely fixed within Task 07, record it as a release blocker and mark readiness **NO-GO** rather than concealing it.

---

## 5. Documentation deliverables (use actual repo paths)

Create or comprehensively update the following, preserving accurate existing information:

```text
README.md
docs/architecture.md
docs/development.md
docs/decisions.md
docs/evaluation.md
docs/security.md
docs/testing.md
docs/demo-guide.md
docs/release-checklist.md
docs/release-report.md
docs/roadmap.md
CHANGELOG.md
LICENSE                 # only preserve existing/known choice or explicitly note license pending
```

Do not create redundant enormous pages if existing docs already cover a topic well; use small cross-links and put each fact in one authoritative document. Preserve `AGENTS.md` unless a minimal, necessary factual fix exists. Preserve earlier prompt files verbatim unless the user asks to modify them.

### 5A. Professional README content

The public-facing `README.md` must have:

1. Clear name/tagline: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**.
2. Problem, use case, what it does and how it works in easy professional English (no unverified superlatives).
3. Feature/status table: implemented, optional, requires live credentials, not implemented.
4. Concise architecture diagram (Mermaid or plain text) using verified module flow.
5. Explicit distinction: Codex helped build the project; TypeSafe AI Jev performs runtime inference.
6. Real requirements: supported Node/npm and necessary GitHub/TypeSafe credentials only for **live** paths.
7. Copyable root install/dev/check/build/CLI commands verified against actual package scripts.
8. Web install/run/check commands verified against `web/package.json`; if Task 06 missing, state so instead of broken commands.
9. `.env.example` description and safe setup; never a real key or example token.
10. Local one-issue CLI example using a committed synthetic example and true `--json` behavior.
11. Explicit fixture evaluation command, generated report location and synthetic-not-live warning.
12. GitHub Actions setup summary, permissions, target-repo template and link to detailed installation docs.
13. Confidence policy explanation including probability distinctions and human-review safeguards.
14. Screenshot/demo section only referencing files which actually exist; otherwise mark **capture pending**.
15. Limitations, security/privacy notice, roadmap, contributor setup (small), and factual license status.
16. No actual accuracy/latency claim absent a reproducible, authorized real observed report with provenance and cohort description.

A README must not announce deployment, GitHub release, published package or real live test unless independently observed. Don't present sample labels as guaranteed model predictions.

### 5B. Architecture and setup docs

- `docs/architecture.md`: accurate source/web/eval/workflow boundaries, trust boundaries, issue text/data flow, source versus test repository installation and failure path.
- `docs/development.md`: platform-aware setup, npm scripts, safe Git phase workflow, local CLI, fixture eval, separate root/web installs, optional live configuration and troubleshooting.
- `docs/decisions.md`: policy semantics, review thresholds as project-specific heuristics, label ownership, no database, read-only dashboard, live gating and sticky security review.
- `docs/testing.md`: offline smoke/regression test matrix, explicit expected observations, manual browser plan and separate optional live integration plan.
- `docs/security.md`: concise threat model and safe secret/permission practices; no unfounded claim of security certification.

### 5C. Evaluation documentation

Document the actual Task 05 schema/scripts and ensure:

- exactly the actual dataset size (30 if completed as planned), composition and hand-annotation provenance;
- fixture-mode result is clearly labeled **synthetic**, no inference performance implied;
- formulas define numerators/denominators, ambiguous cases, acceptable-alternative criteria and zero-denominator handling;
- any optional live results have real invocation metadata, scope, timestamps, failure counts and limitations;
- website evaluations show a real available report or honest missing state; no hardcoded fictional performance figures;
- no raw private issue text, credentials or request headers in a committed report.

Do not run or retroactively fabricate a live benchmark to fill the README. If live numbers are unavailable, explain how an authorized user can run them later.

---

## 6. GitHub Actions and deployment-readiness review

Review `.github/workflows/ci.yml`, `.github/workflows/jevflow-triage.yml`, and `deploy/target-repo/jevflow-triage.yml` if they exist.

Verify/document:

- Existing CI uses the correct lockfile, supported Node and offline checks; permissions at most `contents: read` unless a real additional need exists.
- Issue triage workflow triggers are intentionally limited (expected `issues: opened` and validated manual `workflow_dispatch`); no accidental `pull_request_target`, `edited`, `labeled` or bot loop.
- `contents: read` and `issues: write` permissions as needed; no broad `write-all`.
- No user/model-provided issue body/title inserted as shell expression, command, secret name, ref or path.
- External action version references are verified against current official documentation. Prefer stable reviewed immutable references where appropriate, but **never invent SHAs** or break compatibility by blind pinning.
- `TYPESAFE_API_KEY` is set as the **target repository's Actions secret**, not hard-coded; `GITHUB_TOKEN` is its automatically provided repository-scoped token.
- The workflow in main JevFlow handles only main JevFlow issue events. The separate template must be placed on **`jevflow-test-repo` default branch** to observe that repo's issue events.
- Public source checkout in the target workflow has correctly documented `OWNER/jevflow` and a **real reviewed commit SHA** placeholder. Clearly explain a private-source checkout needs an explicit separate authorized read strategy; do not silently invent a PAT.
- Label setup names align with Task 03 canonical allowlist and disposable sample repo. Idempotence and human-label preservation documented.
- `security-review` is not automatically removed on rerun; provider failure does not invent choices; partial API failures reported honestly.
- GitHub Action comments, if enabled, do not duplicate endlessly or expose full untrusted issue text.
- Source/test checkout paths and command working directories are actually correct and compatible with npm scripts.

A static workflow review is **not equivalent to a real GitHub-hosted Actions test**. State this explicitly in the final report.

Useful official sources for Codex to consult **if available**, verifying current syntax rather than copying outdated examples:

- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- https://docs.github.com/en/rest/issues/labels
- https://github.com/actions/checkout
- https://github.com/typesafe-ai/typesafe-sdk-js
- https://nextjs.org/docs/app

---

## 7. Security and privacy audit

Apply a practical MVP security checklist, not marketing claims:

1. Verify `.env`, local secrets and generated sensitive files are ignored and not already tracked; inspect **filenames and tracked text safely without printing raw secret values**. If anything looks exposed, stop using it, identify affected file/path and inform the user to rotate it; don't copy it into reports.
2. Ensure `.env.example` contains placeholders only; no leaked key in README, examples, test snapshots, log output or screenshots.
3. Verify browser code never imports Jev server client or reads `TYPESAFE_API_KEY`; no `NEXT_PUBLIC_*` secrets, client bundle leakage or key in JSON responses.
4. Ensure production live route is not publicly enabled by a simple toggle without adequate access control; disable live inference by default and document deployment protections/rate limits if production is considered.
5. Check input size limits and server-side runtime validation for issue text; untrusted issue content cannot alter trusted prompts, labels, repository identity, shell commands or GitHub credential use.
6. Confirm sanitized provider/API errors and Action summaries; report failures without raw issue content or authentication headers.
7. Audit dependency manifests and action dependencies. If using `npm audit` or a comparable advisory command, report actual findings/severity with context; do not arbitrarily `npm audit fix --force` or silently upgrade major versions. Network-dependent advisory checks may be NOT RUN.
8. Confirm GitHub permission least privilege, trust boundary and source/target repository separation.
9. Check test fixture/dataset records are synthetic, not copied private customer reports without permission.
10. Document security limitations, especially probabilistic classifications, need for human review and no guaranteed vulnerability detection.

Document each identified risk and whether fixed, accepted/limited, blocked, or pending external verification. Do not claim a full independent security audit or compliance certification.

---

## 8. Full QA and regression verification

Build a **test matrix** in `docs/testing.md` / `docs/release-report.md`. Run actual commands, not just describe them, when corresponding scripts exist.

### 8A. Main/root application — offline

```bash
node --version
npm --version
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run triage -- --help
npm run eval -- --help
npm run eval -- --mode fixture
npm run dev
npm start
```

If a script name differs, use the actual equivalent and record the deviation. If a command is long-running, perform controlled startup and stop normally. The help/bootstrap/check paths **must not** call Jev or mutate GitHub. The evaluation report must visibly identify fixture provenance. Never run live eval merely because a key is present.

Verify installed lockfiles are consistent with fresh install behavior where feasible:

```bash
npm ci
npm run check
```

Do not delete user files or run a destructive cleanup to prove freshness. Use current project scripts/locks and report external dependency/network blockers honestly. Keep CI fully offline in its test/eval behavior.

### 8B. Optional web app — independent verification

If `web/package.json` exists, run equivalent to:

```bash
npm --prefix web ci
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
npm --prefix web run check
```

Only run scripts actually defined; `npm --prefix web ci` is appropriate if `web/package-lock.json` exists and the repo uses npm there. Do **not** invent success or quietly skip a failing relevant check. Verify root build and web build do not cross-contaminate output. If package scripts intentionally differ, document exact commands.

### 8C. Offline integration/behavior checks

Ensure test coverage includes, or add focused regression tests for:

- Empty/invalid issue payloads and bounded titles/bodies.
- All five typed decisions and invalid SDK response handling.
- Selected probability versus separate reported confidence versus P(YES).
- Exact boundary values for auto/review thresholds, critical priority and security/human-review overrides.
- No speculative labels in human-review, only allowlisted labels, sticky security-review and idempotent rerun.
- Wrong repo/issue/PR event rejected; provider failure routes to honest fallback when target known.
- Live calls absent in tests, import, bootstrap, build, fixture eval and preview.
- Dataset validation, zero-denominator metric behavior, report provenance and generated output safety.
- API malformed request/disabled live mode never calls analyzer; preview cannot present synthetic fixture as live.

If meaningful holes exist, add **small targeted tests**; do not duplicate every earlier task's suite or change algorithms without evidence.

### 8D. Browser/manual check (only when available)

Launch the local dashboard in a controlled manner and verify:

1. Initial/landing page renders.
2. Preview sample cases work without key/network inference and say synthetic/fixture clearly.
3. Custom issue UI does not falsely borrow a fixture decision.
4. Loading, empty, invalid input and error states are understandable.
5. Selected probability, reported confidence and P(YES) are labelled correctly.
6. Proposed labels are previews, not live GitHub changes.
7. Evaluation page shows actual artifact with provenance or a clearly explained empty state.
8. Narrow-mobile and desktop layouts are readable; keyboard focus and accessibility basics work.
9. Client source/network responses do not expose a secret.

If screenshot/browser tooling is unavailable, mark screenshots/manual checks **NOT RUN — no browser capture available** rather than fabricating files or claiming visual verification. You may provide a capture guide.

---

## 9. Truthful deployment and live test guide (do not execute automatically)

Create `docs/deployment.md` (or extend the existing target-repo deployment README with a prominent link) containing **two separate** workflows.

### A. Run JevFlow on its own GitHub repository

- Main repo must be on its intended default branch with issue triage workflow committed.
- Set `TYPESAFE_API_KEY` as that repository's Actions secret; confirm required Actions permissions.
- Create a benign synthetic issue, inspect workflow run summary and labels, then manually re-run with validated `issue_number` if supported.
- Explain optional provider calls may incur cost and outputs are probabilistic.

### B. Run on disposable `jevflow-test-repo`

- User manually creates/pushes the already prepared separate test repo if not existing.
- User installs/reviews `deploy/target-repo/jevflow-triage.yml` **inside target repo default branch**, replacing `OWNER/jevflow`/placeholder ref with actual approved source and reviewed commit SHA.
- Use the target repository's `TYPESAFE_API_KEY` Actions secret and target-scoped automatic `GITHUB_TOKEN`; do not assume main repo secrets/token transfer.
- Seed canonical labels if the chosen setup requires it, then start with **one** benign example issue, not all 15 by default (seeding 15 may trigger many provider calls).
- Compare observed result to sample `expected-results.json` **as a hand-authored expectation**, not proof a probabilistic model must match exactly.
- Inspect one ordinary bug, one synthetic security-sensitive issue and one deliberately ambiguous issue, and confirm escalation safety.
- Check manual rerun idempotence, failure handling and one issue/run URL **only when genuinely performed**.
- Include GitHub UI steps and optionally safe `gh` examples, but do not run them without approval.
- Explain public versus private source checkout limitations and restoration/secret rotation procedure if a test key fails.

Separate checkboxes/status in report:

```text
Workflow template reviewed locally: PASS / FAIL / NOT RUN
Installed on target default branch: VERIFIED / NOT DONE
Live Jev inference: PASS / FAIL / NOT RUN
Actual GitHub issue labeling: PASS / FAIL / NOT RUN
Public web deployment: VERIFIED / NOT DONE
```

Do not assert remote success based only on local file existence.

---

## 10. Demo and LinkedIn handoff kit

Create `docs/demo-guide.md` with a 60–90-second **suggested recording storyboard**, not a claim that recording exists:

```text
00–10s  Show JevFlow title and concise problem
10–25s  Show issue input / synthetic Preview Fixture, clearly labelled
25–40s  Explain typed decisions: type, area, priority, security P(YES), review P(YES)
40–55s  Show confidence gate and proposed labels
55–70s  Show offline evaluation provenance and result table (if actual artifacts exist)
70–90s  Show actual GitHub issue + Action summary only if authorized live integration was completed;
        otherwise show workflow architecture and deployment template, labelled as not yet live-tested
```

Add a checklist of **real capture targets**: landing, issue form, results, policy/labels, evaluation page, Actions summary (if real), repo tree. Never synthesize screenshots purporting to be real. Place actual screenshots in `docs/screenshots/` only if captured; otherwise leave a README section marked "Screenshots pending". Do not add huge video files to Git by default.

Create `docs/linkedin-draft.md` with a short, humanized **draft** including:

- “Instead of only reading about Jev, I built a small project with it.”
- Problem and what JevFlow does.
- Structured `choice` and binary P(YES) decisions, app-owned confidence gate, GitHub Actions integration.
- Actual testing/evaluation approach, with figures only if **observed live and sourced**; offline fixture testing clearly labelled.
- One honest challenge/lesson about uncertainty or permissions.
- Links as obvious placeholders until the real public repo/demo URLs are supplied; never invent them.
- No claim that TypeSafe or OpenAI endorsed the project.

This is draft material, not a request to post publicly. Do not post to LinkedIn or connect external social accounts.

---

## 11. Changelog, licensing and release version

Prepare `CHANGELOG.md` for an intended **v0.1.0 MVP** (draft). Include actual implemented capabilities and limitations only. If no license was previously selected by user or already present in repo, **do not guess legal ownership/licensing**: leave a `LICENSE PENDING` release checklist item and ask user to choose after completing safe work. Preserve any existing license accurately. Do not invent contributors, sponsorship, affiliations or dates.

Only prepare release notes; **do not** create a Git tag, GitHub release, npm publish, web deployment or automatic push without explicit authorization. If existing version differs, reconcile it with package files and document the actual current version instead of blindly overwriting.

Create a concise `docs/release-checklist.md` with groups:

- Documentation/readme examples reproducible.
- Root/web offline checks green.
- Evaluation provenance honest.
- Secrets/permissions/repo ownership inspected.
- Workflows/test-repo installation instructions correct.
- Actual local browser check or NOT RUN.
- Paid/live Jev and GitHub test approved/observed or NOT RUN.
- Real repo/demo URLs present or pending.
- License confirmed or pending.
- Release/tag/push/deploy separately authorized or pending.

**Readiness is evidence-based, not a promotional verdict.** `docs/release-report.md` must distinguish:

1. **Offline MVP readiness** — local code/docs/tests status.
2. **Live automation verification** — actually deployed and tested or pending.
3. **Public release readiness** — blockers such as missing real credentials, license, links, deployment decisions or unresolved security defects.

Never say “production ready” solely because offline unit tests pass.

---

## 12. Final report artifact: exact evidence format

Write `docs/release-report.md` from **observed commands, reviewed files and explicit non-runs**, not estimates. Suggested structure:

```markdown
# JevFlow v0.1.0 Release Readiness Report

Date: <actual local date if available; otherwise omit>
Commit reviewed: <actual hash>
Branch: docs/release

## Inventory
- Completed phases observed: ...
- Main CLI/GitHub engine/web/evaluator present: YES/NO, paths

## Offline validation
| Check | Status | Evidence |
|---|---|---|
| Root format | PASS/FAIL/NOT RUN | actual command/result |
| Root typecheck | ... | ... |
| Root lint | ... | ... |
| Root tests | ... | actual passed/failed counts |
| Root build/check | ... | ... |
| Fixture eval | ... | mode, case count, output location |
| Web tests/build | ... | actual counts or no web app |
| Local browser | ... | captured observation or NOT RUN |

## Security and workflow review
- Secret handling: ...
- Browser/server isolation: ...
- GitHub scope/permissions: ...
- Known risks: ...

## External status (never inferred)
- Live Jev API: PASS/FAIL/NOT RUN, evidence
- Test-repo workflow installed: YES/NO, evidence
- Real issue triage: PASS/FAIL/NOT RUN, issue/run links if actual
- Web hosting: VERIFIED/NOT DONE, real URL if actual

## Release blockers / pending actions
- ...

## Outcome
- Offline MVP: READY / NOT READY with reason
- Live verified: YES / NO with reason
- Public release: READY / PENDING BLOCKERS with reason
```

Do not place actual API keys, private issue contents or raw provider errors in this document. A current file path, screenshot, test output and real issue/run link (if user approved and actual) are appropriate evidence.

---

## 13. Execution sequence — Codex should execute, not just propose

1. Read `AGENTS.md`, this full prompt and prior real source/docs/scripts.
2. Confirm correct main repository and baseline checks; record pre-existing failures.
3. Safely create/reuse `docs/release` from `main` with clean/safe branch state.
4. Audit integration contracts and release-blocking defects; make **targeted test-backed fixes** only.
5. Audit GitHub workflows, cross-repo template, security/privacy and server-only Jev boundaries.
6. Update README and architecture/development/testing/evaluation/security docs against actual behavior.
7. Create/finalize deploy guide, demo guide, LinkedIn draft, release checklist and draft changelog.
8. Run root checks, fixture evaluation, `npm ci` where feasible, independent web checks/build and optional actual browser inspection.
9. Clearly mark every absent live/browser/deployment activity as NOT RUN; do not fabricate results or screenshots.
10. Write the evidence-backed release report, document blockers and update `docs/roadmap.md` only after appropriate verification.
11. Format only project-owned intended files, re-run impacted checks and review all diffs/security. Do not sweep/reformat the seven prompts without cause.
12. Commit only Task 07 changes on `docs/release` after successful applicable checks; if merge safe, merge normally into `main` and run root/web checks again.
13. Report current branch/hash/dirty state, exact test results, release status and any manual post-task steps; **STOP.** Do not automatically tag/push/deploy/publish.

---

## 14. Exact validation and safe Git completion

Use actual scripts when names differ; run all applicable checks and record outcomes:

```bash
# Root, all offline
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run triage -- --help
npm run eval -- --help
npm run eval -- --mode fixture
npm run dev
npm start

# Lockfile correctness if safe/available
npm ci
npm run check

# Optional web, only if web/ has package.json + appropriate scripts
npm --prefix web ci
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
npm --prefix web run check

# Git review
git diff --check
git diff --stat
git status --short
```

Use platform equivalents on Windows. Treat missing scripts as deviations requiring documentation, not automatic PASS; don't unnecessarily add aliases merely to satisfy a command list. Do not execute root GitHub runner on a real event or live eval. A stale secret existing in `.env` is not user authorization for paid calls. Never hide failed checks with `|| true`, disabled tests or ignored lint/type errors.

Safe commit example, only when real Git/worktree state permits:

```bash
git status
git diff --check
git add <only reviewed Task-07 files>
git diff --cached --check
git diff --cached --stat
git commit -m "docs: finalize JevFlow MVP QA and release preparation"
git switch main
git merge --no-ff docs/release
npm run check
npm --prefix web run check  # if defined
 git status --short
```

Do not run `git tag`, `git push`, `gh release create`, `gh repo create`, web deployment or external repo mutation. If checks or Git safety block a merge, leave work safely on feature branch and explain exactly what remains.

---

## 15. Mandatory acceptance criteria

- [ ] Main `jevflow` source repo selected; independent test repo untouched.
- [ ] Setup + Tasks 01–06 inspected with actual integration gaps accurately recorded.
- [ ] No second Jev client, classifier/policy or duplicate GitHub mutation path introduced.
- [ ] README accurate, runnable and distinguishes completed features from planned/live-dependent ones.
- [ ] Architecture, development, testing, security and evaluation docs agree with actual source.
- [ ] Correct probability semantics and synthetic/live provenance throughout UI and docs.
- [ ] Root offline checks and existing CLI/eval commands observed; meaningful regressions added for fixes.
- [ ] If present, independent `web/` checks/build verified; otherwise honest absent-app status.
- [ ] GitHub workflows/deployment template reviewed for token scopes, default branch, injection, allowlisted labels and sticky security review.
- [ ] Local browser evidence or explicit NOT RUN, with no fabricated screenshots.
- [ ] No accidental live calls, remote GitHub changes, secrets exposed or provider payments.
- [ ] Demo storyboard and humanized LinkedIn draft prepared without imaginary links/results.
- [ ] Changelog/release notes drafted; actual license decision respected.
- [ ] Release readiness report separates offline/local, live and public-release status and lists blockers.
- [ ] Git review and secret inspection completed; feature branch safely committed/merged if tests and Git state permit.
- [ ] No unapproved push/tag/GitHub release/hosting/publication.
- [ ] Final summary states the exact remaining manual steps and then stops.

---

## 16. Required final response from Codex

Use real observed results and paths in this form:

```text
JevFlow — Task 07 Final QA & Release Preparation Report

Repository: ...
Feature branch: docs/release
Prior tasks present: ...
Release candidate/version: ...

Documentation delivered/updated:
- ...

Integration / security audit:
- Confirmed working paths: ...
- Fixed issues and new regression tests: ...
- Remaining risks/blockers: ...

Observed offline checks:
- root format/typecheck/lint/tests/build/check: ... with actual test counts
- npm ci: PASS/FAIL/NOT RUN (reason)
- fixture evaluation: ... dataset count, provenance and output path
- web check/build/tests: ... real counts or missing web app
- browser/mobile/desktop: PASS/FAIL/NOT RUN (evidence)
- source/target workflow static review: ...
- secret/client-boundary review: ...

External verification:
- Real Jev inference: PASS/FAIL/NOT RUN (why)
- GitHub test-repo deployment/issue labeling: PASS/FAIL/NOT RUN (why)
- Public web hosting: VERIFIED/NOT DONE (why)

Release readiness:
- Offline MVP: READY/NOT READY because ...
- Live verified: YES/NO because ...
- Public release: READY/PENDING BLOCKERS because ...
- Demo/screenshots: real files or pending capture
- License: existing confirmed choice or pending user decision

Git:
- Actual commit hash or blocker: ...
- Merge into main: YES/NO with reason
- Current branch and clean/dirty status: ...
- Remote push/tag/release/deployment: NOT PERFORMED unless separately authorized and actually observed

Deliverables:
- README and docs links/paths
- docs/release-report.md
- docs/demo-guide.md
- docs/linkedin-draft.md
- CHANGELOG.md

Remaining manual approvals/actions: ...
Project completed locally to the extent verified. STOP — no publication without user approval.
```

**EXECUTE TASK 07 ONLY. Do not invent evidence or start a new phase.**
