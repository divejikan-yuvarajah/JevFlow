# JevFlow — Task 03: Confidence Policy, Label Proposals & Local CLI (Codex Edition)

> **Implementation instructions for VS Code + OpenAI Codex — EXECUTE TASK 03 ONLY.**
> Product: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**
> Roadmap: **Phase 3 of 7** (combines the previous individual confidence, labels, failures and CLI tasks)
> Target branch: `feat/confidence-policy`
> Expected foundation: completed Setup + Tasks 01–02 on `main`
> Runtime: Node.js 20+, strict TypeScript ESM/NodeNext, npm and Vitest
> **OpenAI Codex is the coding assistant; TypeSafe AI Jev remains the runtime inference engine.**

---

## 0. Mission and definition of done

Act as the project's senior TypeScript engineer working in the **existing JevFlow repository**, using the Codex extension in VS Code. Read `AGENTS.md` and this complete file before modifying code. Inspect real project files, implement and test the changes, verify them, document them, and safely complete the Git phase. Do not merely describe what someone else should implement.

**End state:** Task 02's validated `TriageResult` is converted by a **pure deterministic confidence policy** into an explainable `TriagePlan`, then into a stable, allowlisted set of **proposed GitHub label names**. An explicit local CLI accepts one issue JSON file, calls the existing real Jev analyzer when authorized/configured, and prints the classification, probability semantics, proposed labels, mode and reasons without performing any GitHub mutation.

All policy/label/CLI tests must run **offline with injected test data and fake analyzer dependencies**, without a Jev key, OpenAI API key, GitHub token or remote repository. No fabricated production AI decisions. Live Jev use is optional and must never be silently invoked by `npm run check` or ordinary tests.

### Phase boundary

| Reuse from Tasks 01–02 | Implement in Task 03 | Defer to later phases |
|---|---|---|
| Domain constants/types; validated app config; ESM toolchain; bootstrap CLI; actual official Jev SDK adapter; five questions; input state/validation; `analyzeIssue`; normalized `TriageResult` | Pure choice gate; risk/review overrides; explainable policy result; label catalog/mapper; local file-driven CLI; offline tests; docs | Task 04 GitHub event parser, Octokit/API, actual labeling, issue comments, GitHub Actions; Task 05 evaluation dataset/benchmark; Task 06 web UI; Task 07 final release |

Do not implement a second inference pipeline, call the OpenAI API for classification, refactor the official Jev adapter without a demonstrated compatibility need, install Octokit for this phase, build a database/dashboard, create issue-triggered Actions, or interact with the disposable `jevflow-test-repo`.

---

## 1. Mandatory preflight: trust the repository, not assumptions

Read and inspect the actual existing implementation, including:

```text
AGENTS.md
prompts/README.md
docs/roadmap.md
docs/architecture.md
docs/decisions.md
docs/development.md
docs/codex-workflow.md
README.md
package.json
package-lock.json
.env.example
src/domain/constants.ts
src/domain/issue.ts
src/config/env.ts
src/triage/triage.types.ts
src/triage/analyzeIssue.ts
src/triage/normalizeResult.ts
src/jev/client.ts
src/jev/questions.ts
src/jev/state.ts
src/cli/index.ts
scripts/smoke-jev.ts
relevant tests and existing exports
```

Use platform-appropriate commands (PowerShell equivalents are fine):

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

Verify all of the following **before coding**:

1. You are in **the main JevFlow product**; if the working directory is `jevflow-test-repo`, STOP and identify the wrong workspace.
2. Task 02 has a working normalizer/analyzer and the prior phase is committed/merged, or clearly report exactly what is incomplete.
3. Inspect actual `TriageResult`, `IssueInput`, config export names and npm script names. The implementation's real types are authoritative. **Do not create competing duplicate result/domain types.**
4. Record existing test/build failures separately from anything introduced in Task 03.
5. Preserve user changes and prior prompt files. Never use `git reset --hard`, `git clean -fd`, force push or silent stash.
6. If live secrets exist locally, do not print them, inspect their contents or copy them into reports.

### Work on the prescribed Git branch

Use `feat/confidence-policy` from a verified clean `main`. Inspect and safely reuse the branch if it already exists. Update from a remote only when it is the known intended upstream and `git pull --ff-only` is safe. Do not make an unnecessary new repository or automatically push to GitHub.

Illustrative sequence only; adapt to actual state:

```bash
git switch main
# git pull --ff-only    # only if justified and safe
git switch -c feat/confidence-policy
```

If the tree is dirty and cannot be safely branched without moving user work, report the blocker instead of discarding it. Keep `AGENTS.md` intact unless a minimal factual compatibility change is required.

---

## 2. Contract with Task 02 — preserve probability meaning

Task 01's canonical, single-source choices are expected to be:

```ts
ISSUE_TYPES = ['bug', 'feature', 'documentation', 'question', 'maintenance'];
ENGINEERING_AREAS = ['frontend', 'backend', 'database', 'devops', 'ai', 'security', 'general'];
PRIORITIES = ['critical', 'high', 'medium', 'low'];
AUTOMATION_MODES = ['auto', 'review-suggested', 'human-review'];
```

Import actual types/constants instead of recopying these arrays into new competing definitions.

The **Task 02 Codex Edition** intended conceptual normalized shape is:

```ts
interface ChoiceDecision<T extends string> {
  value: T;
  selectedProbability: number;  // P(selected choice) from the choice distribution
  confidence: number;          // distinct SDK-reported choice confidence
  probabilities: Readonly<Record<T, number>>;
}

interface TriageResult {
  issueType: ChoiceDecision<IssueType>;
  engineeringArea: ChoiceDecision<EngineeringArea>;
  priority: ChoiceDecision<IssuePriority>;
  securitySensitive: { probabilityYes: number };  // Jev noul P(YES)
  needsHumanReview: { probabilityYes: number };  // Jev noul P(YES)
  meta: {
    model: string;
    latencyMs: number;
    inputTruncated: boolean;
    truncatedFields: readonly string[];
    usage?: { inputTokens: number; outputTokens: number };
  };
}
```

**These are an illustration, not permission to overwrite the actual Task 02 contract.** If the implemented fields differ (for example `reportedConfidence`, `yesProbability`, `metadata`), follow the actual typed exports. Adapt policy access in one narrow integration layer if necessary, keeping the tested semantics identical. Do not coerce to `any` just to make a guessed field name compile.

Critical distinctions:

- A `choice` answer's **selected-option probability** and SDK **reported confidence** are separate values. Preserve both, and never silently substitute one for the other.
- A `noul` answer is **P(YES)**. It is not a generic confidence measure, not a boolean and not a confirmed security vulnerability. In particular, `securitySensitive.probabilityYes = 0.10` does **not** mean 10% confidence that the issue is safe.
- Task 03 makes **no further Jev inference**. It uses a deterministic rule set over Task 02 output.
- Prompt-injected issue text is untrusted data. It cannot change thresholds, allowed label names or policy rules.

Existing config defaults from Task 01 are expected to be:

```dotenv
AUTO_THRESHOLD=0.90
REVIEW_THRESHOLD=0.75
```

Reuse the existing validated config reader. Both thresholds are finite values in `[0, 1]`, with `REVIEW_THRESHOLD <= AUTO_THRESHOLD`. Never silently invent defaults after encountering an invalid config object at the policy boundary.

---

## 3. Required policy API and data contracts

Implement a pure, synchronous, deterministic function, for example:

```ts
evaluateTriagePolicy(result: TriageResult, config: AppConfig): TriagePlan
```

Reuse the actual `AppConfig` type or a narrow typed selection of it. No logging, network calls, SDK instantiation, mutation of arguments, current time, random values, filesystem access or global state inside the policy engine.

The app-level `TriagePlan` should expose at least:

```text
mode: 'auto' | 'review-suggested' | 'human-review'
choiceScores: {
  issueType: number,
  engineeringArea: number,
  priority: number
}
overallChoiceGateScore: number
thresholdsUsed: { auto: number, review: number }
securityReviewRequested: boolean
reasonCodes: readonly stable machine-readable reason strings[]
```

You may include human-readable short descriptions, `inputTruncated`, candidate values and public probabilities as appropriate, but **never raw issue title/body, API key, provider error object, or unvalidated SDK payload** in this policy result.

Document exact reason codes. Recommended stable values (adapt to existing code convention, do not use prose as machine IDs):

```text
choice_auto_threshold_met
choice_review_threshold_met
choice_below_review_threshold
critical_priority_manual_review
security_probability_manual_review
human_review_probability_manual_review
security_probability_caution
human_review_probability_caution
input_truncated_review_suggested
```

Keep reasons unique and in documented deterministic order. Expose evidence-bearing numeric values separately from human-readable messages.

---

## 4. Confidence gate — precise implementation

For each of three `choice` decisions, use **this conservative JevFlow-specific policy heuristic**:

```ts
choiceScore = Math.min(selectedProbability, confidence);
overallChoiceGateScore = Math.min(
  issueTypeScore,
  engineeringAreaScore,
  priorityScore,
);
```

The field named `confidence` above means **Task 02's reported SDK confidence** even if the actual project used another property name. This minimum heuristic is **an application policy**, not an official Jev definition of calibration or accuracy. Do not average the three categories: a highly uncertain priority must not be hidden behind certain type/area predictions.

Apply inclusive boundaries without pre-rounding:

```text
score >= AUTO_THRESHOLD
  → provisional auto

score >= REVIEW_THRESHOLD and below AUTO_THRESHOLD
  → provisional review-suggested

score < REVIEW_THRESHOLD
  → provisional human-review
```

When the thresholds are equal, test the auto branch first: an exactly equal score qualifies as `auto` unless a safety override applies. Use strict numeric validation at the policy boundary; invalid/missing normalized values or config should fail with a sanitized error, **not** be clamped/guessed. Task 02 should already validate inference output, but direct policy callers and tests must still be handled predictably.

Both `selectedProbability` and reported `confidence` must remain observable for later documentation/evaluation; they are not interchangeable.

---

## 5. Cautious override rules — explicit thresholds

Use named, documented constants, and treat them as **application-policy choices**, not vendor-guaranteed thresholds:

```ts
SECURITY_REVIEW_YES_THRESHOLD = 0.50;
CAUTION_YES_THRESHOLD = 0.35;
HUMAN_REVIEW_YES_THRESHOLD = 0.50;
```

Conservative mode order:

```text
auto < review-suggested < human-review
```

Apply rules without ever downgrading an already more cautious mode:

1. If Jev suggests `priority === 'critical'`, force `human-review`, regardless of choice confidence. This denotes manual triage, **not proven criticality**.
2. If `securitySensitive.P(YES) >= 0.50`, force `human-review` **and** set `securityReviewRequested = true`; this means security review is warranted, not that a vulnerability has been confirmed.
3. If `needsHumanReview.P(YES) >= 0.50`, force `human-review`. Do not treat P(YES) as a confidence score.
4. If either P(YES) is `>= 0.35` and `< 0.50`, require **at least** `review-suggested`.
5. If Task 02 metadata says `inputTruncated === true`, require **at least** `review-suggested` because unseen details could affect classification. Do not claim that the truncated text was fully evaluated. Do not turn this rule into a GitHub mutation.
6. Otherwise retain the choice-gate mode.

Set `securityReviewRequested` **only** for the explicit security threshold `>= 0.50`, not merely because `engineeringArea === 'security'`, `priority === 'critical'` or a generic caution is present. If multiple rules apply, record each applicable reason once in stable order. Verify exact boundaries `0.35`, `0.50`, `0.75`, `0.90` and tiny values immediately below them in tests.

If a later rule would require stricter review, raise the mode; no rule can lower it. Avoid vague random overrides or implicit probability rounding.

### Failure semantics

Malformed normalized inputs, missing config, nonfinite/negative/out-of-range policy values or unsupported category labels **must not generate permissive plans**. Throw/return an explicitly typed sanitized policy error. Task 04 will later implement the GitHub-side failure-to-human-review path. The Task 03 CLI must return a nonzero exit code on policy/analyzer failure and **must not fake a successful classification or proposed labels**.

---

## 6. Canonical GitHub label catalog — pure mapper, not API integration

Implement a single static, typed, allowlisted catalog under `src/github/labels.ts` (or the closest compatible location). The word “GitHub” describes the eventual destination; **this module performs zero GitHub calls now**. Reuse Task 01 canonical category values and Task 03 `TriagePlan`, with a function such as:

```ts
getProposedLabels(result: TriageResult, plan: TriagePlan): readonly string[]
```

Canonical labels:

```text
type:bug                  area:frontend           priority:critical
type:feature              area:backend            priority:high
type:documentation        area:database           priority:medium
type:question             area:devops             priority:low
type:maintenance          area:ai
                          area:security
                          area:general

jev:auto-triaged
jev:review-suggested
jev:human-review
security-review
```

Add central approved metadata (colors/descriptions) only if useful for Task 04. No labels may be constructed from arbitrary issue title/body, raw provider messages or unknown categories. Keep the names identical to those expected by the existing `jevflow-test-repo` label setup.

### Exact mode-to-label mapping

| Policy mode | Proposed category labels | Proposed mode label | Other |
|---|---|---|---|
| `auto` | exactly one validated `type:*`, one `area:*`, one `priority:*` | `jev:auto-triaged` | `security-review` only if policy explicitly requests it; under this policy that override forces human-review |
| `review-suggested` | only if **all three** choice scores meet `REVIEW_THRESHOLD`; otherwise omit all speculative category labels | `jev:review-suggested` | No new `security-review` unless the explicit policy flag applies |
| `human-review` | **no category labels**; avoid presenting uncertain classifications as established | `jev:human-review` | Add `security-review` if and only if `securityReviewRequested` is true |

Use a fixed deterministic order: type, area, priority, one mode label, optional security-review. Never emit two mode labels or duplicates. The mapper is pure and idempotent for identical inputs. It must reject inconsistent/malformed plans rather than silently treating an unknown mode as `auto`.

**Task 04 boundary:** it will later reconcile the proposed label list with existing issue labels and preserve unrelated user labels. Do not implement API calls, label creation/removal, comments or reconciliation here.

---

## 7. Local CLI — explicit real Jev call, no GitHub writes

Create a dedicated CLI such as `src/cli/triage.ts`, preserving the Task 01 `src/cli/index.ts` bootstrap and the Task 02 manual `scripts/smoke-jev.ts`.

Required npm script:

```json
"triage": "tsx src/cli/triage.ts"
```

Required invocation examples:

```bash
npm run triage -- --help
npm run triage -- --file examples/sample-issue.json
npm run triage -- --file examples/sample-issue.json --json
```

Use Node built-ins and existing dependencies (`tsx`, `dotenv`) where possible; do not install an oversized command-line framework for three flags. The CLI must:

1. Parse `--help`, required `--file <path>`, optional `--json`; reject missing values/unknown flags/ambiguous duplicate paths with concise usage instructions.
2. **Never instantiate Jev or require `TYPESAFE_API_KEY` for `--help`.** Module imports must not trigger network calls.
3. Explicitly load the input file locally; cap file size to a documented reasonable limit such as **64 KiB** before JSON parsing. Fail fast for missing/unreadable/non-JSON/oversized input.
4. Require an object with valid `title` and supported `body` shape; reuse Task 02 validation/state-building rather than create inconsistent validation. Optional metadata may match `IssueInput`. Do not silently accept arbitrary raw GitHub event payloads.
5. Keep `.env` local/ignored and use the existing config/client path. Missing TypeSafe key on an intentional real analysis gives an actionable, sanitized nonzero error.
6. Call the existing `analyzeIssue` **once at the application level** for a valid requested analysis; SDK-level internal HTTP retries are outside this claim. Then call pure policy, then pure label mapper.
7. Human-readable stdout: issue number if available (not raw issue body), predicted type/area/priority with **selected probability and reported confidence shown separately**, binary `P(YES)` values, gate score, mode, reason codes, proposed labels, measured latency if actually available.
8. `--json`: emit exactly **one valid JSON document to stdout**, no banner/debug text; send sanitized errors to stderr with nonzero exit. JSON schema should be stable and machine-consumable; never serialize entire raw issue or SDK response.
9. Do not print API key, auth headers, full input issue body or raw provider error. Sanitize outputs by design instead of globally logging catch objects.
10. Do not issue network requests when no valid input file exists. Do not read/write GitHub issues or create remote labels.
11. For testability, separate arg parsing/file loading/report formatting/main orchestration; inject a fake analyzer and output writers in offline tests instead of spawning a real provider.
12. Set correct exit codes for success, invalid usage/input and provider/policy failure. Never say analysis succeeded if it failed.

Create `examples/sample-issue.json` with **synthetic non-sensitive data**, for example:

```json
{
  "title": "Login endpoint returns 500 after refresh token expiry",
  "body": "After a token expires, the backend responds with HTTP 500 instead of asking the user to sign in again.",
  "issueNumber": 42,
  "repository": "example/jevflow-demo"
}
```

Do not put real credentials, personal information or production incident details into sample fixtures. Do not automatically run the example against live Jev unless the user explicitly authorizes the billable/external smoke execution.

---

## 8. Suggested implementation file map

Adapt minimally to the real repository; **preserve actual working exports** and ESM `.js` relative specifiers where needed:

```text
src/
├── policy/
│   ├── confidenceGate.ts      # pure result + config → plan
│   ├── thresholds.ts          # named override thresholds, reuse main config values
│   └── policy.types.ts        # mode, reason codes, TriagePlan and sanitized errors
├── github/
│   └── labels.ts              # canonical allowlist and pure proposal mapper ONLY
├── cli/
│   ├── index.ts               # preserve bootstrap unchanged unless strictly needed
│   └── triage.ts              # explicit local file-based analyzer
└── triage/
    └── ...                    # Task 02 output; no duplicate analyzer or normalizer

examples/
└── sample-issue.json

tests/
├── confidence-policy.test.ts
├── github-labels.test.ts
└── cli-triage.test.ts

README.md
docs/architecture.md         # small update if necessary
docs/decisions.md
docs/development.md
docs/roadmap.md
package.json                # add triage script only; avoid unnecessary deps
package-lock.json           # change only when necessary
```

Do not create empty modules that pretend to implement future GitHub operations. Avoid circular imports: Task 02 triage result → Task 03 pure policy → pure proposed labels → CLI presentation.

---

## 9. Mandatory offline Vitest coverage

Use the repository's **existing** Vitest configuration. Create typed fixture builders based on **actual Task 02 exports**, with deliberately different selected-option probability and SDK confidence. Never use a real SDK call in tests.

### Policy / gate

1. Exact default `0.90` qualifies for provisional `auto`; `0.899...` does not.
2. Exact `0.75` qualifies for `review-suggested`; just below leads to `human-review`.
3. `Math.min(selectedProbability, confidence)` is used per category; a high selected probability with low reported confidence lowers the gate.
4. The **weakest of type/area/priority** determines the aggregate gate, not an average.
5. Custom valid config thresholds affect the result deterministically.
6. Equal valid thresholds follow the documented auto-first comparison.
7. Invalid/out-of-range/nonfinite config or malformed result fails safely, with no guessed permissive mode.

### Overrides / reasons

8. Suggested `critical` priority forces `human-review`, even with choice scores near 1.
9. Security P(YES) exactly `0.50` forces human review and security-review flag; immediately below does not flag it.
10. Human-review P(YES) exactly `0.50` forces human review independently of choice scores.
11. Security and review P(YES) at exactly `0.35` require at least review-suggested; immediately below do not trigger caution.
12. Safety overrides never downgrade an already more cautious outcome.
13. Input truncation requires at least review-suggested and is explained, without claiming full source coverage.
14. Multiple reasons appear once in deterministic order.
15. Low P(YES) is not displayed/tested as generic low confidence.

### Label mapping

16. Auto gets exactly three canonical category labels and `jev:auto-triaged`.
17. Review-suggested gets categories only if every category score reaches review threshold; caution with weak classifications omits categories.
18. Human-review gets `jev:human-review` and optional `security-review`, never speculative categories.
19. Security-review is driven only by explicit security policy flag, not just the area name.
20. Full option coverage from Task 01 arrays, exact stable order and no duplicates or conflicting `jev:*` modes.
21. No GitHub API dependency or token is needed to map labels.

### CLI / integration boundaries

22. `--help` runs without key, file read or external request.
23. Unknown flags, missing `--file`, missing file, oversized input, malformed JSON and wrong shape fail before analysis.
24. Fake injected analyzer is called once for valid input; policy/labels/report use its normalized test fixture.
25. Human output distinguishes selected probability, confidence and binary P(YES).
26. `--json` stdout is exactly one parseable JSON value without issue body/secret values.
27. Analyzer/policy failure returns nonzero and sanitized stderr, with no fabricated label list.
28. Imports, `npm test`, `npm run check`, `npm run dev`, `npm start` and CLI `--help` perform no paid/live Jev call.
29. All prior Task 01/02 tests still pass and the explicit Task 02 smoke runner remains separate.

Fixture outputs are **synthetic test data** and must never be presented as actual Jev measurements. Do not assert exact external model labels or response timings in the offline suite. Never weaken Task 02's strict response normalization to make fixtures pass.

---

## 10. Documentation and roadmap updates

Update only the necessary existing files, with accurate implemented-versus-planned status:

- `README.md`: new local `npm run triage -- --help` / file / JSON usage, clearly state labels are **proposed locally**, not applied to GitHub yet.
- `docs/decisions.md`: define the choice minimum heuristic; explain why selected probability, reported confidence and binary P(YES) differ; thresholds; safety override precedence; exact reason codes; truncation handling; why `security-review` is not a confirmed vulnerability.
- `docs/development.md`: setup, example input, ignored local `.env`, help/input errors, offline testing and the distinction between the regular CLI and explicit live smoke.
- `docs/architecture.md`: show Task 02 `analyzeIssue` → Task 03 policy → label proposal → local CLI; Task 04 will own actual GitHub mutations.
- `docs/roadmap.md`: mark Task 03 complete **only after** implementation, verification and safe merge; otherwise mark in progress/blocked truthfully.
- `.env.example`: retain existing keys/defaults; add comments only if necessary, never actual secrets.
- `AGENTS.md` and existing prompt files: preserve; change only for a demonstrated conflict, never wholesale rewrite.

Do not claim a live Jev request ran when the secret was unavailable or authorization was not given. Do not describe the app as already installing labels/automating GitHub issues.

---

## 11. Codex execution sequence

Proceed in this order, without jumping into Task 04:

1. Read `AGENTS.md`, this entire prompt and relevant actual Task 01/02 source/tests.
2. Inspect environment, branch and baseline checks; confirm correct repository and no unsafe user changes.
3. Establish/reuse `feat/confidence-policy` safely.
4. Define policy result/reason types and named override constants, using actual normalized data fields.
5. Implement pure confidence gate, monotonic overrides and defensive policy-input validation.
6. Implement static allowlisted label catalog and pure proposal mapper.
7. Implement local file-driven CLI with separately testable parser, formatting and orchestration; preserve bootstrap and smoke.
8. Add synthetic example issue.
9. Add comprehensive offline tests; confirm prior tests remain green.
10. Update docs and roadmap accurately. Apply formatting only within appropriate existing scope; do not unexpectedly reformat all long prompt files.
11. Run checks, fix actual failures and review diff/secrets/ignored files.
12. Commit verified code on the feature branch. Merge to `main` safely only after the checks pass and the tree is safe; re-run checks on merged `main`.
13. Report real observed results, live-test status and current Git state. **STOP before Task 04.**

Use the real project scripts rather than creating duplicate ones. Do not install unnecessary dependencies or use `any`, `@ts-ignore`, ignored tests or error suppression as shortcuts.

---

## 12. Required validation commands

Run and record observed results (adapt to existing script names only when necessary and explain the deviation):

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run dev
npm start
npm run triage -- --help

git diff --check
git status --short
git diff --stat
```

**All commands above must work without a TypeSafe key, GitHub token, external API call or paid inference.** The bootstrap and `--help` must remain safe. Check compiled ESM imports if any CLI path is included in the build. Fix issues introduced by Task 03 rather than hiding failures.

These next commands are **optional LIVE Jev tests, requiring explicit user authorization and an already configured ignored local `TYPESAFE_API_KEY`**:

```bash
npm run triage -- --file examples/sample-issue.json
npm run triage -- --file examples/sample-issue.json --json
```

Do not automatically execute them merely because an API key might be present. If skipped, record `NOT RUN — live Jev access not authorized` (or the true reason), not `PASS`. Never display the secret. Review JSON output shape with test fakes offline regardless.

Before commit inspect staged files, including `git diff --cached`; verify no `.env`, credentials, issue bodies, unexpected generated artifacts or unrelated repositories are included.

Suggested commit message:

```text
feat: add confidence policy label proposals and local triage CLI
```

For a safely verified clean branch, intended merge sequence is approximately:

```bash
git switch main
git merge --no-ff feat/confidence-policy
npm run check
git status
```

Do not merge with failing checks. Do not perform force operations or unapproved remote pushes. If a commit/merge cannot be made, preserve work and report the exact obstacle; never invent hashes or claim a clean main without checking.

---

## 13. Mandatory acceptance criteria

- [ ] Working in main JevFlow repo, not `jevflow-test-repo`; existing setup and Tasks 01–02 preserved.
- [ ] Pure, deterministic and typed `TriageResult` → `TriagePlan` function implemented.
- [ ] Choice score uses minimum of **selected probability** and distinct reported confidence for each dimension.
- [ ] Overall gate uses the weakest of all three choice dimensions; thresholds configurable and inclusive.
- [ ] Explicit critical, security, human-review, caution and truncation overrides are deterministic and monotonic.
- [ ] Binary Jev P(YES) never misrepresented as classification confidence or verified vulnerability.
- [ ] Stable reason codes and exposed policy evidence; no sensitive issue contents in result.
- [ ] Allowlisted, deterministic proposed label mapping with correct policy-mode restrictions.
- [ ] No actual GitHub API/network mutations or issue-trigger workflow added in this phase.
- [ ] Local CLI accepts one JSON issue file; supports `--help`, `--file`, `--json` and sanitized failure output.
- [ ] CLI invokes existing analyzer once only on explicit real file-run and no analyzer on invalid input/help.
- [ ] No live calls during unit tests, build, check, bootstrap or help.
- [ ] Robust offline policy/labels/CLI tests, plus all Task 01/02 tests passing.
- [ ] Docs accurately distinguish local proposed labels from Task 04 remote automation.
- [ ] Secret/diff inspection completed; commit/merge and live-test statuses factually reported.
- [ ] Task 04, benchmark, UI and release work not implemented prematurely.

---

## 14. Final factual report required from Codex

Finish with a concise, evidence-based report structured like this:

```text
JevFlow — Task 03 Implementation Report

Repository: ...
Branch: feat/confidence-policy
Task 01/02 baseline check: PASS / FAIL / NOT RUN (reason)

Implemented:
- Pure policy entry point / actual exported name
- Named policy thresholds and rule precedence
- Proposed label mapper / canonical label catalog
- Local CLI entry and npm script
- Tests and docs

Actual policy behavior:
- Choice score and aggregate gate: ...
- Auto/review threshold values: ...
- Security / human review / critical / truncation overrides: ...
- P(YES) versus choice confidence kept separate: YES/NO

Observed validation:
- format:check: ...
- typecheck: ...
- lint: ...
- tests: ... (actual pass/fail counts)
- build: ...
- check: ...
- bootstrap dev/start: ...
- triage --help: ...
- live Jev CLI: PASS / FAIL / NOT RUN (reason)
- git diff --check: ...

Files changed: ...
Secret / unrelated-file review: ...
Commit hash: ... or blocked reason
Merge into main: YES / NO (reason)
Working tree: CLEAN / DIRTY (details)
Remote push: NOT PERFORMED unless explicitly authorized and actually verified
Known blockers / deviations: ...

Confirmed NOT implemented: GitHub issue mutations, GitHub Actions triage,
Task 05 evaluation suite, Task 06 dashboard, Task 07 release.
Next: Task 04 — GitHub Integration & Automation.
```

**EXECUTE TASK 03 ONLY. Stop after completing and reporting this phase.**
