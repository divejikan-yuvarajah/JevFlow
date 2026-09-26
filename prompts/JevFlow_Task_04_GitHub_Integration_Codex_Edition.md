# JevFlow — Task 04: GitHub Integration, Automation & Action Summary (Codex Edition)

> **Complete implementation prompt for VS Code + OpenAI Codex — EXECUTE TASK 04 ONLY.**  
> Project: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**  
> Roadmap: **Phase 4 of 7** after Setup and completed Tasks 01–03  
> Working branch: `feat/github-automation`  
> Runtime: Node.js 20+, strict TypeScript ESM/NodeNext, npm, Vitest, real TypeSafe AI Jev SDK, GitHub Actions and REST API/Octokit.  
> Coding assistant: **OpenAI Codex**. Application runtime inference: **TypeSafe AI Jev**. They are distinct.

---

## 0. Mission and definition of success

Act as the senior TypeScript engineer, GitHub Actions engineer and security reviewer **inside VS Code using the Codex extension**. Read the root `AGENTS.md` and this entire prompt. Inspect actual source exports and existing tests before writing code. Implement, test, document and commit actual working changes rather than describing how to do it.

**Task 04 end state:** When a supported GitHub issue event occurs, JevFlow can securely identify the issue, invoke the existing Task 02 `analyzeIssue`, feed the normalized result to Task 03's **unchanged deterministic policy and label proposal**, reconcile only JevFlow-owned labels on that exact issue, record a concise GitHub Actions job summary, and fail safely when inference/API operations fail. Provide a ready-to-configure workflow template for installing JevFlow into a **separate** `jevflow-test-repo`.

### Do now

- Source-repository issue event parsing, identity validation and manual-dispatch support.
- Narrow dependency-injected GitHub API adapter and safe label reconciliation.
- Orchestration of existing Jev → existing policy → existing label proposal → actual GitHub API.
- Sanitized job summary; optional idempotent, controlled bot comment only if feasible.
- One main-repo workflow, one **distinct target-repo installation template**, minimal permissions, documentation.
- Comprehensive **offline** unit/integration tests with fake GitHub API and fake analyzer; workflow static checks.
- Safe branch, validation, commit and merge process.

### Do not do now

- Do not build Task 05's 30-issue evaluation suite, Task 06 dashboard or Task 07 release polish.
- Do not introduce a second classifier or alter Jev SDK to call OpenAI instead.
- Do not change the established Task 03 policy thresholds/risk overrides just to make a test pass.
- Do not import, modify, seed or push to the live separate testing repository automatically.
- Do not make real Jev calls, mutate remote issues, add repository secrets or create a live GitHub repo without the user's explicit authorization.
- Do not claim external tests succeeded merely because offline tests passed.

## 1. Required preflight: inspect the repository first

Read `AGENTS.md`, `docs/roadmap.md`, `docs/architecture.md`, `docs/decisions.md`, `docs/development.md`, `docs/codex-workflow.md`, `README.md`, `package.json`, `package-lock.json`, `.env.example`, `.github/workflows/ci.yml`, the current Task 02 and Task 03 source code/tests, and any prior Task prompt relevant to compatibility.

Run applicable commands or PowerShell equivalents:

```bash
pwd
git status --short
git branch -a
git log --oneline -5
git remote -v
node --version
npm --version
npm run check
```

Confirm all of the following:

1. This is **the main JevFlow product repository**, not `jevflow-test-repo`. If wrong, stop before modifying anything.
2. Tasks 01–03 are present, and their real exports/signatures—not filenames imagined in this prompt—are inspected. Specifically find actual `IssueInput`, `TriageResult`, `analyzeIssue`, `TriagePlan`, `evaluateTriagePolicy`, `getProposedLabels` or their actual equivalents, and canonical label catalog.
3. Preserve existing `AGENTS.md`, the Setup docs and all user-written prompt files. Respect ESM `.js` relative import conventions, npm scripts, config injection and test patterns already in use.
4. Record any pre-existing failures separately. Do not wipe or rewrite working functionality to meet a guessed structure.
5. Never print or inspect actual `.env` secret contents or include credentials in logs, comments, reports or diffs.

### Feature branch workflow

Use exactly `feat/github-automation`. If `main` is clean and the correct branch exists, safely create the feature branch from it. If a feature branch already exists, inspect/reuse without overwriting. Use `git pull --ff-only` only for a known intended upstream and clean state. Never run `git reset --hard`, `git clean -fd`, force push or silent stash. If unsafe due to uncommitted user changes, preserve them and report the blocker.

Illustrative commands only, never blindly execute:

```bash
git switch main
# git pull --ff-only  # only if safe and intended
git switch -c feat/github-automation
npm run check
```

## 2. Preserve Task 02 and Task 03 semantics exactly

Task 02 returns three typed choices—`issueType`, `engineeringArea`, `priority`—with a **selected-option probability** and **separate provider-reported confidence**, plus two binary decisions `securitySensitive` and `needsHumanReview` represented as **P(YES)**. Binary P(YES) is not general confidence and does not establish that a vulnerability exists.

Task 03 already owns:

- Its pure `TriageResult → TriagePlan` engine, choice gate and configurable thresholds (default auto 0.90, review 0.75).
- Safety overrides for critical priority, security, human-review and truncated input.
- One deterministic, allowlisted proposed-label mapper.
- Local CLI, which **must remain a local CLI without side effects on GitHub**.

Import the **actual** existing exports. Do not recreate thresholds, re-interpret P(YES), reimplement policy in the workflow, or derive labels independently from issue text or raw Jev responses.

Expected broad label behavior (check real Task 03 contract):

| Existing policy mode | Existing proposed-label behavior |
|---|---|
| `auto` | Three eligible type/area/priority labels + `jev:auto-triaged` |
| `review-suggested` | Category labels only when all three scores meet the established review threshold + `jev:review-suggested` |
| `human-review` | `jev:human-review`; `security-review` only if Task 03's explicit security policy requests it; no speculative category labels |

A failure in a real provider call **must not fabricate a `TriageResult`**. It must take a separate, explicitly marked error/fallback path. Labels remain **untrusted output until validated against the static catalog**.

## 3. Understand the two-repository deployment model

```text
main source repo: OWNER/jevflow
  src/... actual code
  .github/workflows/jevflow-triage.yml
  └─ receives issue events only from OWNER/jevflow

independent target repo: OWNER/jevflow-test-repo
  prebuilt sample app/issues/labels
  .github/workflows/jevflow-triage.yml  ← install the deployment template HERE
  └─ receives issue events from OWNER/jevflow-test-repo
```

**Workflows must exist on the target repository's default branch for its `issues` triggers.** A workflow in the source repository does not listen to issues in the test repository. The automatic `GITHUB_TOKEN` belongs to the workflow's own repository; do not assume it can write to another repository.

Implement two deliverables:

**A. Main-repository workflow:** `.github/workflows/jevflow-triage.yml`. It checks out the main project itself, uses `npm ci`, executes its automation runner and labels issues **in the main repository** if/when its default branch has the workflow and the repo is configured.

**B. Disposable target-repository template:** `deploy/target-repo/jevflow-triage.yml` and `deploy/target-repo/README.md`. This workflow is copied to the **separate** `jevflow-test-repo` default branch by the user/authorized setup. For a **public** JevFlow source repo, check out `OWNER/jevflow` into a named subdirectory, pin `ref` to a verified immutable **full commit SHA**, run `npm ci` in that subdirectory, then invoke the same runner using the **target repo's** event payload, `GITHUB_TOKEN` and `TYPESAFE_API_KEY` Actions secret. Leave conspicuous placeholders and an install checklist, never silently invent `OWNER` or SHA. `checkout` should not persist its credentials longer than needed. The template must be unambiguous that it requires configuration before deployment.

If the source repo is private, the target repo's normal token does not necessarily read it. Document the limitation; provide an option to package/publish a versioned build or use a separately authorized, narrow read-only credential. **Do not create a broad PAT** or accidentally expose private source. Do not copy entire source into the test repo as a shortcut.

The previously prepared test repo includes `.github/labels.json`, `npm run seed:labels`, `npm run seed:issues`, `sample-issues/issues.json` and `sample-issues/expected-results.json`. Use those **as external test fixtures**, not as material to merge into this repo. Describe the installation steps, but do not execute a live seed, push or workflow deployment without explicit authorization.

## 4. Security and trigger boundaries

Use only these MVP triggers in both workflows:

```yaml
on:
  issues:
    types: [opened]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Existing issue number to re-run JevFlow on'
        required: true
        type: string
```

- `issues.opened` supports new issues; it must not run on every edit or label update.
- `workflow_dispatch` requires validation of a positive safe integer issue number and fetching the **current** issue from the repository API; reject pull-request-shaped issue objects.
- No default `issues.edited`, `issues.labeled`, `issue_comment`, `pull_request_target`, `workflow_run`, or untrusted PR checkout in this task. Avoid bot action loops and unnecessary paid inference.
- Do not interpolate issue title/body or model output into shell commands, GitHub expressions, file paths, action names, branch refs or executable code.
- Put untrusted payload in `GITHUB_EVENT_PATH`, which the Node runner reads as bounded input. Do not trust event payload metadata to override the actual workflow repository.
- Restrict token permissions explicitly, roughly:

```yaml
permissions:
  contents: read
  issues: write
```

- Pass the target repository's `secrets.GITHUB_TOKEN` (or the equivalent `${{ github.token }}`) and `secrets.TYPESAFE_API_KEY` through step environment. Never put secrets in YAML literals or print them.
- Choose a supported, maintained checkout/setup-node version compatible with GitHub-hosted runners, checking official current docs rather than copying a guessed major version. The app itself still targets Node.js 20+. Pin third-party actions to an approved immutable SHA where reasonably practical or document approved stable references; do not fetch/execute arbitrary issue-supplied code.
- Set a reasonable job timeout (e.g. 10 minutes) and per-issue concurrency key for automatic/manual processing, avoiding race conditions and untrusted user text as a key.
- Do not allow a fork PR's content to execute in the privileged issue-triage workflow.

Official docs to consult when available:

- https://docs.github.com/en/actions/reference/events-that-trigger-workflows
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
- https://docs.github.com/en/rest/issues/labels
- https://docs.github.com/en/rest/issues/issues
- https://docs.github.com/en/rest/issues/comments
- https://github.com/actions/checkout
- https://github.com/actions/setup-node

## 5. Expected file/module boundaries

Adapt naming to **actual repository code**; the structure is a guide, not permission to duplicate an existing module:

```text
src/
  github/
    eventParser.ts           # pure trusted event interpretation
    client.ts                # narrow Octokit wrapper, injectable
    issueActions.ts          # fetch/label operations via GitHub adapter
    reconcileLabels.ts       # pure minimal add/remove/keep calculation
    summary.ts               # pure safe Markdown job-summary builder
    runTriage.ts             # one orchestration path and fail-safe fallback
  cli/
    github-action.ts         # guarded Actions entrypoint
  triage/                    # reuse existing analyzer, not fork
  policy/                    # reuse existing policy, not fork
.github/workflows/
  ci.yml                     # preserve existing working CI
  jevflow-triage.yml         # main-repo issue workflow
deploy/target-repo/
  jevflow-triage.yml         # distinct installation template
  README.md
tests/github/
  eventParser.test.ts
  reconcileLabels.test.ts
  issueActions.test.ts
  runTriage.test.ts
  summary.test.ts
  workflow-contract.test.ts  # optional static YAML/contract checks
```

Add only a minimal necessary dependency: choose one maintained **`@octokit/rest` OR `octokit`**, check compatibility with project's Node runtime and installed tooling, update `package-lock.json`. Prefer injected interfaces and test doubles. Do not add both packages without justification. No Express server, Next.js, database, authentication, OpenAI SDK or new AI inference provider.

Use existing TypeScript source/domain exports, existing logger/error conventions, `.js` specifiers for NodeNext relative imports, and existing Vitest setup.

## 6. Event parser and validated issue identity

Implement a small, pure parser plus bounded event-file reader. Read the event path from `GITHUB_EVENT_PATH` (as a file) and inspect `GITHUB_EVENT_NAME`, `GITHUB_REPOSITORY`, `GITHUB_STEP_SUMMARY`, and relevant validated event fields. Validate the true repository in strict `owner/repo` form from runner environment. Never accept a repository URL or owner/repo name embedded in an issue body as the API destination.

Required behavior:

1. For `issues` + `action: opened`, extract positive safe integer issue number and validate the event's repo identity, title, optional body (`null`→empty string) and issue shape.
2. For `workflow_dispatch`, strictly validate `issue_number`, then fetch **current issue title/body** through the GitHub API. Do not assume synthetic `github.event.issue` exists for dispatch.
3. Reject or skip unsupported event/action types without contacting Jev or applying labels.
4. Distinguish harmless skip (not a supported event) from a malformed issue with a known valid target that may need safe error handling.
5. Check and reject issue objects containing `pull_request` on API fetch.
6. Cap event JSON read size before parsing; surface sanitized errors, not raw webhook JSON or secrets. Prevent arbitrary file-read/URL overrides from issue text.
7. Validate the event and API target consistently before mutation. Do not label a guessed issue if repo/number is untrusted or missing.
8. Avoid echoing entire untrusted issue body/title in logs, Actions summary or thrown exceptions. Pass bounded canonical input through existing Task 02 builder.

Design event parsing and issue retrieval to be separately unit-testable.

## 7. Narrow GitHub API adapter with dependency injection

Implement an authenticated GitHub REST adapter that can be replaced by an in-memory fake in all unit tests. It should expose just the operations needed:

- fetch a single issue (for manual dispatch or verification), ensuring issue not PR;
- list current labels on that issue;
- check/create a **missing static allowlisted repository label** with centrally approved name/color/description (or choose/document one-time `seed:labels` instead of creation; the workflow must handle missing labels accurately);
- add one or more approved labels;
- remove specific stale **managed** labels;
- optionally find/create/update one marked JevFlow bot comment if implemented;
- append a controlled summary to `GITHUB_STEP_SUMMARY` using safe Node filesystem APIs.

Never allow raw model/user text to choose an arbitrary label name, API owner/repo, comment URL or API endpoint. Use only the intended event repository and statically approved names. Validate before making mutations. Catch API `404`, `403`, already-exists and rate/timeout errors thoughtfully; sanitize messages. Do not dump Octokit error objects or authorization headers.

**Allowlist source:** derive from Task 03's exact catalog rather than creating a competing set. If catalog lacks colors/descriptions, add these once in a backward-compatible typed representation. Follow pre-existing sample repo names. Do not treat `security-review` as automatically removable.

## 8. Pure idempotent label reconciliation

Create a deterministic pure function accepting:

```text
current issue labels
proposed labels from Task 03 (already validated against allowlist)
static app-managed catalog
```

Return at least `toAdd`, `toRemove`, `unchanged` and any essential explanation. All output names must be exact allowlisted strings.

The reconciler MUST:

- Manage only **exact** catalog names in `type:*`, `area:*`, `priority:*` and `jev:*` groups; never delete an unfamiliar user label that merely starts with a similar prefix.
- Preserve unrelated human/community labels such as `help wanted`, `customer-reported`, `blocked`.
- On rerun, remove stale owned mode/category labels where safe and add new desired ones; prevent conflicting `jev:*` modes and duplicates.
- Treat `security-review` as sticky: if already present, do NOT auto-remove it even if a later policy result no longer proposes it. Human security labeling must be preserved.
- Be idempotent: identical inputs must cause no API writes, repeated calls must not duplicate bot comments.
- Prefer adding/ensuring desired labels **before** removing stale managed labels to minimize destructive partial failures.
- On any API partial failure, report actual succeeded/failed operations truthfully; never claim full reconciliation success.
- Never use an API call that overwrites the **entire** issue label list (such as a blanket `setLabels`) where it would remove unrelated labels.

Test unknown-prefix labels, duplicates, sticky security, zero-change reruns, mode transitions, human-review removal of speculative categories and partially missing catalog definitions.

## 9. Orchestration — one existing analysis path

Create a single injected orchestration entry point in `src/github/runTriage.ts` or its architectural equivalent:

```text
validated supported event
   ↓
trusted repository + issue number
   ↓
current/verified issue input
   ↓
existing analyzeIssue(issue)                 [once at application level]
   ↓
existing evaluateTriagePolicy(normalized result)
   ↓
existing getProposedLabels(plan/result)
   ↓
static allowlist validation
   ↓
fetch current labels → pure reconciliation
   ↓
add approved labels → remove stale owned labels
   ↓
append sanitized GitHub Actions summary
```

- Reuse actual Task 02 and Task 03 exported signatures. Do not copy the Task 03 thresholds or recalculate its policy.
- Keep a narrow injected analyzer interface so orchestration tests never invoke the network. One `analyzeIssue` invocation does not necessarily mean one raw HTTP request because SDK transport may retry; document this distinction.
- Avoid accidentally calling Jev on unsupported events, malformed targets or manual dispatch of a PR.
- Do not automatically retry a paid Jev inference at the orchestrator level. A future retry policy is out of scope.
- Do not update issue title/body, assign people, close an issue, change milestone, or post speculative security conclusions.

### Fail-safe escalation without fabricated inference

When Jev/provider/normalization/policy fails and issue identity is **already validated**:

1. Record a sanitized inference/policy failure; do **not** synthesize a fake `TriageResult` or category probabilities.
2. Attempt to ensure `jev:human-review` exists and add it to that issue.
3. Remove stale `jev:auto-triaged`/`jev:review-suggested` markers **only when safe**; preserve any existing category/human/security labels rather than guessing new classifications.
4. Preserve existing `security-review` and any human labels; never auto-clear it.
5. Append summary identifying this as a failure-path review, not a successful analysis.
6. If fallback labeling itself fails due to permission/API issues, report failure, record which operations actually occurred, and return a non-success job status. Do not claim escalation succeeded.
7. If repository/issue identity is uncertain, **do not mutate any issue**; fail the Action and emit a sanitized error summary.

An issue already in a human-review mode and a rerun with a valid confident result may be reconciled only according to the established policy and strict exact-label rules; sticky security-review remains.

## 10. GitHub Actions job summary (required)

Build a pure Markdown renderer from **validated normalized result, policy plan and actual operation report**. Append to `GITHUB_STEP_SUMMARY` only when it is a valid runner-provided path; unit tests use a temporary file.

Suggested display:

```text
# JevFlow Triage

Issue: #42  (canonical repository; link derived from validated identity)
Run status: Completed / Human review fallback / Failed / Skipped

Decision              Selected      P(selected)   Reported confidence
Issue type            bug           0.96          0.94
Engineering area      backend       0.93          0.91
Priority              high          0.87          0.84

Security sensitive: P(YES) 0.41
Needs human review: P(YES) 0.82
Policy: review-suggested
Reason codes: ...

Changes: added [...] / removed [...] / unchanged [...]
Provider latency: actual recorded value if available
```

- Escape Markdown/links for any dynamic displayed values. Prefer validated enum strings and numeric fields; do not include raw issue body, pasted secrets, malicious issue-provided Markdown/HTML or raw provider error objects.
- Clearly distinguish selected choice probability, reported confidence and Noul **P(YES)**.
- `security-review` means investigation requested—not confirmed compromise.
- Display truthful skipped/failed/fallback paths; never include invented probabilities or latency.
- Keep output short and easy to inspect in GitHub Actions; no generated text explanation is required.

### Optional issue-facing comment

Only if the core flow is stable: one marked, sanitized JevFlow report comment that is updated rather than duplicated on manual reruns. Scope the update to a comment authored by the appropriate bot identity and containing the exact private app marker. Never overwrite arbitrary human comments or embed raw user issue content. If this introduces time/cost/complexity, skip it and document as deferred. The required workflow summary is enough for MVP.

## 11. GitHub Actions workflows — both must be usable safely

### A. Main repository workflow

Create `.github/workflows/jevflow-triage.yml`.

- Triggers `issues: [opened]` and `workflow_dispatch` with a strictly validated issue number.
- Runs on a GitHub-hosted supported runner (e.g. `ubuntu-latest`), with compatible official checkout/setup-node actions; Node 20 for application execution. Use `npm ci` for lockfile reproducibility.
- Explicit `permissions: {contents: read, issues: write}`; no blanket `write-all`.
- Uses the **main repo** event payload and token. Passes `TYPESAFE_API_KEY` from Actions secrets to only the relevant runner step and `GITHUB_TOKEN` from the workflow's own token.
- Calls the new npm script `npm run triage:github` (adapt only if existing script style justifies a name change). This command must NOT run during standard CI/check.
- Provides appropriate timeout and per-issue concurrency without issue title/body in expressions.
- Does not expose secrets in stdout, summary or artifacts.
- Respects main CI workflow; no change to `ci.yml` merely to make live triage happen.

### B. Target repository workflow template

Create `deploy/target-repo/jevflow-triage.yml` with prominent **CONFIGURE BEFORE INSTALL** instructions in its README. It needs:

- target issue triggers on its own default branch;
- target repo's own event and token;
- separate public source checkout for a reviewed, pinned `OWNER/jevflow` commit SHA, if that distribution method is selected;
- `npm ci` and `npm run triage:github` inside source subdirectory;
- the event path, target identity, token and secret preserved correctly during separate checkout;
- explicit warning that the template cannot read a private source repository using only the target `GITHUB_TOKEN`;
- no `owner`, SHA or secret values invented by Codex;
- instructions to configure repository Actions write permissions if repo/org settings restrict the token;
- a user-facing checklist to install, validate and explicitly test it.

**Do not directly modify the actual independent test repo during Task 04.** A prepared template and verified doc satisfy the offline deployment deliverable. An unconfigured placeholder template should not be presented as a live-enabled deployment.

### Additional workflow verification

Check YAML syntax and GitHub workflow semantics (especially handling of YAML `on` with YAML 1.1 loaders); prefer an actionlint-compatible static test if practical, without adding a heavy runtime dependency merely for this. Check all placeholders in the install guide. Do not claim hosted Actions ran unless you saw a real run.

## 12. Test plan — mandatory entirely offline

Reuse installed Vitest and use fake API/analyzer dependencies. Cover these **meaningful test families**:

### Event parser

- `issues.opened` with valid issue, body null/empty and unicode title.
- manual dispatch positive issue number and API fetch of current issue text.
- zero, negative, non-integer, unsafe integer and missing issue numbers.
- invalid repository names, mismatched event identity, unsupported events/actions.
- PR-shaped issues, oversized/unparseable event JSON and malicious string content.
- no external calls when identity cannot be established.

### Reconciler and labels

- allowed labels are added from Task 03 proposal only.
- unrelated/community labels and lookalike-prefix labels are preserved.
- duplicate/no-change reruns generate zero writes.
- manual rerun mode transition removes only exact stale owned mode/category labels.
- `security-review` sticky behavior.
- correct add-before-remove behavior and partial-failure reporting.

### Orchestration

- injected analyzer invoked **once** for valid supported issue.
- actual existing Task 03 policy/label mapper are used (real pure functions in tests if practical).
- invalid events, missing target identity and PR targets do not invoke analyzer or mutate GitHub.
- provider failure causes `jev:human-review` fallback only when a trusted issue identity exists; no manufactured choices/scores.
- fallback API failure produces non-success and truthful summary.
- permission denied, missing labels, rate limit and transient API errors do not report fake success.
- no comment duplication if optional comment implemented.

### Summary and workflow contracts

- summary prints real validated metrics and clearly labels P(YES), not generic confidence.
- escaped malicious issue data/links are not executable or rendered unsafely.
- error/fallback summary contains no raw issue body, secrets, token or provider exception dump.
- main + target workflows: required triggers, least permissions, secret references, Node/npm build path, target checkout identity and action command.
- retain all prior Task 01–03 tests, CLI bootstrap/help, CI and build behavior.

Synthetic fixture probabilities are offline **test data**, not real Jev measurements. No API key, GitHub token, paid inference, network access or live repository required for the full `npm run check` suite.

## 13. npm scripts and documentation updates

Preserve existing `dev`, `start`, `build`, `typecheck`, `lint`, `format:check`, `test`, `check`, `triage`, `smoke:jev` where present. Add one clear script, for example:

```json
"triage:github": "tsx src/cli/github-action.ts"
```

This script is **external-action-only**: never include it inside `npm run check`, ordinary tests, on file import, or bootstrap. Guard it so it requires supported GitHub runner context and validated event/credentials before trying to mutate anything. Tests inject fakes and call orchestrator modules directly; do not simulate a live GitHub run by setting a real user's credentials unknowingly.

Update selectively:

- `README.md`: Task 04 actual capabilities, installation and separation between source/target repositories; no false claim of live hosting.
- `docs/architecture.md`: event → Jev result → established policy → proposed labels → strict reconciler → GitHub API → summary; failure path.
- `docs/development.md`: local check commands, guarded runner, manual dispatch and how to examine Action summaries.
- `docs/decisions.md`: label ownership, sticky security-review, no wildcard overwrites, trusted issue identity, repository-scoped token, default-branch issue workflow constraint.
- `docs/roadmap.md`: mark Task 04 complete only if offline implementation and validation/merge genuinely succeeded. Record live integration status separately.
- `.env.example`: add only comments/placeholders if needed; no real credentials.
- `deploy/target-repo/README.md`: step-by-step public-source install, placeholder replacement, secret configuration, default-branch check, label setup and real test procedures with the sample repository.

### Required target-repo manual testing instructions (document, do not automatically run)

1. Get/approve an intended source repo and **full SHA**, confirm it is public for the checkout template.
2. Put workflow on `jevflow-test-repo` default branch; adjust owner/source/SHA; verify action references.
3. Configure target Actions secret `TYPESAFE_API_KEY`; never put value in a commit or chat. Ensure target workflow has necessary token write access.
4. Seed canonical labels using the sample repo's `npm run seed:labels` if your chosen policy needs it.
5. Create **one benign sample issue** first; inspect one real workflow run, Jev result, labels and summary.
6. Test a security-sensitive synthetic scenario and an ambiguous issue; explain predictions may vary and are not proof of a vulnerability.
7. Test manual `workflow_dispatch` by issue number; ensure idempotent label reconciliation.
8. Verify fail-safe response to a provider failure in an isolated test only with authorization; restore secret/config afterward.
9. Seed the remaining 15 sample issues only if desired/authorized—these can trigger multiple paid Jev requests. Use Task 05 to evaluate against hand-authored expected results, not to assert deterministic model output.

If no live test is authorized or no key/repo is configured, report **NOT RUN**, not pass or failed.

## 14. Codex execution order

1. Read `AGENTS.md`, this complete file, previous phases' real source and tests. Verify the main `jevflow` workspace and baseline check.
2. Safely establish/reuse `feat/github-automation`; preserve all user work.
3. Add one compatible GitHub REST dependency only if needed; update npm lockfile.
4. Implement trusted event parser and bounded event-file reader (automatic + manual paths).
5. Implement narrow injected GitHub API wrapper.
6. Implement pure allowlisted reconciliation, sticky security-review and minimal mutation plan.
7. Implement orchestrator using existing analyzer/policy/proposal exactly once in normal path, and genuine fail-safe fallback.
8. Implement sanitized Actions summary; optional single-marker bot comment only if safe and tested.
9. Implement guarded runner/npm script and source workflow.
10. Implement **separate** test-repository deployment template and installation guide without touching the actual test repo.
11. Add meaningful offline tests, workflow contract checks and documentation/status updates.
12. Format appropriately without reformatting every user-supplied long prompt, run all checks and inspect secret/diff safety.
13. Commit Task 04 on its branch only after validation; merge normally into `main` if safe and re-run checks on main.
14. Present a factual report and **STOP before Task 05**.

## 15. Required validation commands and Git completion

Run relevant existing scripts and report their **observed** status, without implicitly making live inference calls:

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run triage -- --help
npm run dev
npm start

git diff --check
git status --short
git diff --stat
```

If `dev` or `start` is long-running, verify controlled startup then stop it cleanly. Run `npm ci` and a subsequent check if a dependency/lockfile changed, subject to normal non-secret network/package availability. Include explicit tests for the new Actions runner via fake provider/GitHub adapters; do **not** invoke the live `npm run triage:github` outside a deliberately authorized/isolated Actions environment.

Review all staged changes (`git diff --cached --check`, `git diff --cached --stat`, filenames) and verify no `.env`, token, whole raw webhook, real issue bodies or generated accidental artifacts are committed. Suggested commit:

```text
feat: integrate confidence-aware GitHub issue automation
```

Safe example when branch/tree/tests permit:

```bash
git add <only reviewed Task-04 files>
git commit -m "feat: integrate confidence-aware GitHub issue automation"
git switch main
git merge --no-ff feat/github-automation
npm run check
git status --short
```

Do not auto-push/create repos or mutate remote test issues. Do not delete branch before confirming successful merge and checks; do not merge failing tests or use destructive commands. If blocked, preserve work and truthfully report it.

## 16. Acceptance criteria (all necessary for completed offline Task 04)

- [ ] In main JevFlow source repo, with Setup + Tasks 01–03 preserved, Git-safe branch workflow followed.
- [ ] Supported `issues.opened` + manual dispatch parse to a verified current issue target; invalid/PR targets are safe.
- [ ] Existing analyzer runs once at app level in normal supported path; Task 03 policy and proposed label mapping reused, not copied.
- [ ] Narrow injected Octokit wrapper and exact static allowlist for label mutation.
- [ ] Pure minimal reconciler, irrelevant labels preserved, security-review sticky, repeat runs idempotent.
- [ ] Add-before-remove order; partial operations and GitHub errors truthfully reported.
- [ ] Provider/normalizer/policy failure uses known-target human-review fallback **without fake probabilities/categories**.
- [ ] Missing target or failed fallback mutation returns honest non-success; no wrong-issue mutations.
- [ ] Sanitized Actions summary with distinct P(selected), reported confidence and P(YES), clear actual action status.
- [ ] Main workflow and target-repo installation template both exist; correct token/event scope, secrets, triggers and default-branch guidance.
- [ ] Actions permissions least-privilege; no user/model text interpolated into shell or workflow expressions.
- [ ] Meaningful fully offline event/API/reconciler/orchestrator/summary/workflow tests; prior tests unaffected.
- [ ] `npm run check` and existing bootstrap/CLI remain green; no live API call during ordinary checks.
- [ ] Docs accurately state installed versus optional live-tested status; no secrets or unapproved remote operations.
- [ ] Feature branch committed/merged safely if permitted; otherwise exact blocker recorded.
- [ ] Task 05 evaluation, Task 06 dashboard and Task 07 release not implemented yet.

## 17. Final mandatory report from Codex

Use factual fields and observed results. Example structure:

```text
JevFlow — Task 04 Implementation Report

Workspace: ...
Branch: feat/github-automation
Task 01–03 baseline: PASS / FAIL / NOT RUN (why)

Implemented:
- Actual event parser/runner exports and files
- GitHub client + label catalog/reconciler
- One-analysis orchestration and failure behavior
- Action summary / optional marker-scoped comment status
- Main workflow + target installation template/docs

Security:
- Trusted issue identity; bounded event input: ...
- All proposed labels static/allowlisted: ...
- Human/community labels preserved; security-review sticky: ...
- No raw user text in shell; no secrets in output: ...

Actual validation:
- format:check ...
- typecheck ...
- lint ...
- tests ... (real pass/fail counts)
- build ...
- check ...
- local CLI/bootstrap unaffected ...
- workflow static/contract check ...
- npm ci if relevant ...
- git diff --check ...

Live Jev and GitHub issue labeling:
- PASS with actual run/issue links OR NOT RUN with precise reason.
- Target template installed? YES/NO, actual status.

Git:
- Commit hash (real) or blocker
- Merge into main: YES/NO, why
- Working tree: CLEAN/DIRTY, details
- Push: NOT DONE unless explicitly approved and verified

Known limitations and deviations: ...
Next: Task 05 — Testing, Evaluation & Benchmarking.
```

**Execute Task 04 ONLY. STOP without starting Tasks 05, 06 or 07.**
