# JevFlow — Task 05: Testing, Evaluation & Benchmarking (Codex Edition)

> **VS Code + OpenAI Codex implementation prompt — EXECUTE TASK 05 ONLY.**  
> Product: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**  
> Roadmap: **Phase 5 of 7**, after Setup and completed Tasks 01–04  
> Target Git branch: **`test/evaluation-suite`**  
> Expected runtime: Node.js 20+, strict TypeScript ESM / NodeNext, npm, Vitest.  
> **Codex writes/tests the implementation. TypeSafe AI Jev is the application's runtime inference provider. Never substitute an OpenAI classification call for Jev.**

---

## 0. Mission and definition of success

You are the senior software engineer and evaluation engineer working inside **VS Code with the OpenAI Codex extension**. Read `AGENTS.md` and **this entire file** before editing. Inspect the current repository; preserve the actual modules, exports and behavior from earlier tasks rather than blindly implementing illustrative filenames here.

**Task 05 end state:** JevFlow contains a reproducible, typed evaluation harness with approximately **30 reviewed synthetic GitHub issues**, documented expected annotations, a deterministic **offline** end-to-end fixture mode, metrics with explicit denominators, a safe **explicitly opt-in** live Jev benchmarking mode, sanitized machine-readable and Markdown reports, meaningful regression tests, and accurate documentation. The existing Task 01–04 project passes its checks unchanged. No external network/API/GitHub issue mutation is required for Task 05 offline completion.

### Do now

- Add evaluation data and a transparent annotation guide.
- Expand meaningful unit, integration and regression coverage for the existing flow.
- Create a typed dataset loader/validator and evaluation runner.
- Make a **network-free deterministic fixture mode** that exercises normalized results → policy → proposed labels, and the event/automation adapters where feasible with injected fakes.
- Add metrics: classification, automation coverage, escalation, choice probabilities/uncertainty and processing latency with correct semantics and denominators.
- Provide **separately gated live** benchmarking through the existing real Task 02 `analyzeIssue`, if explicitly authorized; never run it in standard checks/CI.
- Generate consistent JSON and Markdown result reports, without fabricated measurements or credential/raw-issue leaks.
- Update docs and roadmap; safely commit and merge the tested feature branch.

### Not in scope

- Do **not** implement the Task 06 Next.js dashboard or Task 07 release/LinkedIn packaging.
- Do **not** redesign Task 02 Jev questions or change Task 03 thresholds/policy just to raise benchmark accuracy.
- Do **not** replace Jev with OpenAI API calls, add a database, train/fine-tune a model, introduce extra paid inference services or deploy infrastructure.
- Do **not** create/seed/label live GitHub issues, push to `jevflow-test-repo`, or configure repository secrets on the user's behalf.
- Do **not** assert live Jev performance from offline synthetic fixtures; distinguish simulations, human annotations and actual provider observations everywhere.

---

## 1. Inspect the real project and run the baseline before coding

First read the existing files and exports (some filenames may differ):

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
src/jev/client.ts
src/jev/questions.ts
src/jev/state.ts
src/triage/triage.types.ts
src/triage/analyzeIssue.ts
src/triage/normalizeResult.ts
src/policy/confidenceGate.ts
src/policy/policy.types.ts
src/github/labels.ts
src/github/eventParser.ts
src/github/reconcileLabels.ts
src/github/runTriage.ts
src/github/summary.ts
src/cli/triage.ts
src/cli/github-action.ts
.github/workflows/ci.yml
.github/workflows/jevflow-triage.yml
deploy/target-repo/README.md
existing tests/ and examples/
```

Run platform-appropriate commands (PowerShell equivalents are permitted):

```bash
pwd
git status --short
git branch -a
git log --oneline -6
git remote -v
node --version
npm --version
npm run check
```

**Preflight requirements:**

1. Verify current workspace is the **main `jevflow` source repository**, not the disposable `jevflow-test-repo`. Stop if incorrect.
2. Verify actual Task 02 `TriageResult` probability fields, Task 03 `evaluateTriagePolicy` / `getProposedLabels` contracts, and Task 04 GitHub runner's injectable seams. Reuse names/types from real source; do not create parallel contradictory types.
3. Confirm Tasks 01–04 are present, integrated and on `main`, or report an exact blocker. Record pre-existing failures separately from newly introduced errors.
4. Preserve uncommitted user work. Never use `git reset --hard`, `git clean -fd`, force-push, silent stash or broad rewriting.
5. Keep **ordinary tests, imports, CI, bootstrap and `npm run check` free from paid/network inference**.

### Required Git branch

Create/reuse only `test/evaluation-suite` from a verified safe `main` baseline:

```bash
git switch main
# git pull --ff-only  # only for a verified intended remote and safe clean worktree
git switch -c test/evaluation-suite
```

If that branch exists, inspect and reuse safely. If the Git state prevents safe switching, preserve files and report the blocker rather than discarding changes. Do not automatically publish the repository or push to an unverified remote.

---

## 2. Existing system contract: preserve exact semantics

The canonical category vocabulary from Task 01 is expected to be:

```text
Issue type: bug | feature | documentation | question | maintenance
Engineering area: frontend | backend | database | devops | ai | security | general
Priority: critical | high | medium | low
Policy mode: auto | review-suggested | human-review
```

Task 02 exposes three `choice` answers (`issueType`, `engineeringArea`, `priority`) and two binary `noul` answers (`securitySensitive`, `needsHumanReview`). Keep these distinct:

- `selectedProbability`: Jev's probability assigned to the selected choice.
- `confidence`: its **separately reported choice confidence**, never silently replaced by `selectedProbability`.
- `probabilityYes`: the binary **P(YES)** for security relevance or need for human review. It is **not** model confidence and is **not proof** of a security vulnerability.
- `meta.latencyMs` or equivalent: actual observed timing around the provider request when a live call was made; never pretend fixture time is model latency.

Task 03's published policy is authoritative. Its suggested gate uses the minimum of selected-choice probability and distinct reported confidence per category and then the minimum of all three categories; its defaults are `AUTO_THRESHOLD=0.90` and `REVIEW_THRESHOLD=0.75`. The existing documented overrides for critical classification, security/review P(YES), ambiguity and input truncation must remain intact. **Read the implementation; do not reproduce slightly different formulas in the evaluator.** Call the existing policy for every relevant example.

Task 04 owns GitHub side effects. The evaluation layer must not make direct GitHub mutations, and it must not mistake a proposed label for a successfully applied label.

---

## 3. Deliverable structure (adapt minimally to existing source)

Prefer this concise layout:

```text
evals/
├── README.md
├── annotation-guide.md
├── dataset/
│   └── github-issues.json          # ~30 synthetic records, versioned/committed
├── fixtures/
│   └── normalized-decisions.json   # clearly SYNTHETIC deterministic responses
├── dataset.types.ts
├── loadDataset.ts
├── fixtureProvider.ts
├── runEvaluation.ts
├── metrics.ts
├── report.ts
└── results/
    └── .gitkeep                    # runtime reports ignored by default

src/cli/
└── evaluate.ts                     # if a CLI module best fits existing layout

tests/evals/
├── dataset.test.ts
├── metrics.test.ts
├── fixture-runner.test.ts
├── policy-matrix.test.ts
├── integration-regression.test.ts
├── reporting.test.ts
└── live-gating.test.ts

docs/
├── evaluation.md
└── roadmap.md                     # update accurate phase status

package.json                         # eval scripts; preserve earlier scripts
.gitignore                           # ignore generated reports, not dataset/fixtures
README.md                            # concise evaluation instructions
```

Keep single-root npm architecture. Prefer existing dependencies and built-in Node APIs; install only a genuinely necessary, compatible small dependency. All new scripts must work on Windows/PowerShell and Linux (avoid shell-specific pipes/redirections or `rm -rf`). Compiled ESM imports must respect NodeNext `.js` specifiers where appropriate.

**Do not add mock output to production Jev adapter.** Synthetic fixture injection belongs exclusively in eval/test code.

---

## 4. Dataset design: 30 clear, realistic synthetic issues

Create a **self-contained 30-record versioned dataset** based on realistic software-development cases. Prefer to align the first 15 scenarios with the previously provided disposable test repository's 15 sample issues **if that source file is actually available in this workspace**; otherwise recreate comparable original *synthetic* examples rather than claiming you imported an unavailable file. Never modify the other repository to source data.

Coverage targets across 30 cases (overlap across dimensions is intended):

- Standard backend, frontend, database and CI/DevOps bug reports.
- Feature, documentation, question and maintenance cases.
- AI/RAG reliability and agent-action cases.
- Security-relevant examples such as suspected IDOR, leaked staging key, authorization or information exposure; **use fictional details and no real credentials**.
- Ambiguous/short/vague reports, missing reproduction steps and cross-area classification ambiguity.
- Critical/high/medium/low expected priorities with stated rationale.
- Cases requiring human review because risk or ambiguity is consequential.
- At least two Unicode/multiline examples, one empty-body issue and a truncation test (keep oversized content in a generated test rather than bloating committed dataset).

Do not invent real organization/repo names or use real user's personal/sensitive data. Clearly state all records are illustrative scenarios, not production incidents.

### Suggested typed record

```ts
interface EvaluationIssue {
  id: string;                       // stable unique ID, e.g. JF-001
  title: string;
  body: string;
  tags: readonly string[];          // analysis cohorts: security, ambiguous, etc.
  expected: {
    issueType: IssueType;
    engineeringArea: EngineeringArea;
    priority: IssuePriority;
    securitySensitive: boolean;     // HUMAN ANNOTATION, not Jev probability
    needsHumanReview: boolean;      // HUMAN ANNOTATION, not Jev probability
    acceptableAlternativeAreas?: readonly EngineeringArea[];
    annotationConfidence?: 'high' | 'medium' | 'low';
    rationale: string;
  };
}
```

Use actual domain types and schema checks, not this interface blindly. Keep boolean human annotations separate from model's numeric P(YES). Where a record admits multiple plausible areas, mark an acceptable-alternative set and explicitly report **strict accuracy** separately from **acceptable-answer accuracy**; never quietly treat all alternatives as if they were the single ground-truth label. For ambiguous records, define why review is expected rather than reverse-engineering expected labels to match output.

### Dataset validation

Reject:

- incorrect record count or duplicate/empty IDs;
- absent/empty title, invalid body, missing `expected` fields;
- labels outside canonical unions or alternatives outside canonical options;
- empty/missing rationale or contradictory alternatives;
- accidental API keys/credential-looking strings and external private issue URLs where practical;
- invalid dataset version/schema metadata.

Document annotation provenance, decision rubric and limitations. Commit the source annotations alongside the data; do not assert expert-reviewed or perfectly objective ground truth.

---

## 5. Synthetic offline fixtures: different from provider measurements

Create synthetic, typed **normalized Task 02-style** test responses. Their values are deliberately authored to test policy and reporting, **not generated by Jev**.

Each dataset record should have a corresponding fixture (or a deterministic fixture-generator with explicit per-case overrides) containing:

- three valid canonical `choice` distributions;
- selected option and selected probability;
- distinct reported choice confidence;
- two valid P(YES) values;
- legitimate `meta` fixture fields clearly marked synthetic; do not give synthetic model timings that appear to be live measurements;
- enough targeted boundary values to exercise Task 03 thresholds and overrides.

Fixture correctness is checked through public types/normalization validators where feasible. Do not bypass runtime validation to stuff invalid objects into policy except in tests that explicitly assert invalid input is rejected. You may deliberately include misclassifications and uncertain cases to verify metrics; do not make every fixture magically accurate.

**Important:** Offline fixture metrics describe the *testing harness / policy behavior* only. Never headline them as Jev accuracy, Jev latency or real service costs.

---

## 6. Required evaluator architecture

Keep the runner testable with injectable components. Recommended design:

```text
load and validate dataset
        ↓
choose execution mode
        ├─ offline fixture source (default; NEVER network)
        └─ explicitly authorized LIVE Jev source
        ↓
for each issue: normalized TriageResult
        ↓
existing Task 03 policy evaluator
        ↓
existing Task 03 proposed-label mapper
        ↓
per-case evaluation record
        ↓
aggregate metrics + sanitized reports
```

Use an `IssueAnalyzer` interface or existing injected dependency type so the runner can accept a fake result source. The evaluator itself must **never** initialize Octokit or apply labels/comments. Do not invoke Task 04's live GitHub CLI; if testing automation integration, inject a fake GitHub client and synthetic event payload in dedicated offline tests.

- Evaluate records in deterministic dataset order, not filesystem/glob randomness.
- A single record failure should appear in the results with a sanitized failure code; it should not silently disappear, and the runner should continue unless a fatal global validation/setup failure makes further results meaningless.
- Keep counts consistent: `total = succeeded + failed + skipped` (when skipped is supported).
- Use an immutable evaluation snapshot of config/thresholds in the report; do not print secrets.
- Limit concurrency; **live default should be sequential** to avoid surprise API load/rate limits. Any future concurrency flag must be explicit and bounded.
- Store raw issue title/body only in the committed synthetic dataset, not duplicated in exported result files. Link per-case metrics by safe record ID.
- Record actual run timestamp, dataset version and mode. A fixture run should say `mode: offline-fixture` and `provider: synthetic-fixture`, never `provider: jev-live`.

---

## 7. Evaluation metrics — precise definitions and denominators

Create pure functions that take per-case records and return a typed `EvaluationSummary`. These definitions must be documented and unit-tested. All division-by-zero cases return `null`/`N/A` as appropriate, **not NaN, Infinity or fake 100%**.

### A. Dataset/run accounting

- Total cases; succeeded; failed; skipped (if supported).
- Completion rate = succeeded / total.
- Failure breakdown by sanitized error category.
- Keep live partial-run denominators explicit. Never silently compare 10 evaluated items against a 30-item full dataset as a complete result.

### B. Classification

For each of issue type, area and priority:

```text
strict accuracy = correct predictions / successfully evaluated cases with annotation
```

Also report counts/denominators, not just percentages. For area, if alternatives are explicitly annotated, compute and **separately name** acceptable-answer accuracy; retain strict accuracy as primary. Provide per-class count/confusion matrix where useful, without a heavy chart library. Report total exact-all-three accuracy only for records having all three category annotations, with its denominator.

### C. Human/automation outcomes

- `autoCount`, `reviewSuggestedCount`, `humanReviewCount` and each proportion over successful evaluations.
- **Automation coverage** = number with actual *policy* mode `auto` / successfully evaluated cases. This is a simulated policy decision, not confirmed GitHub label execution.
- **Automated subset classification accuracy** = fully correct three-category results among `auto` cases / number of `auto` cases (N/A if none).
- **Review-required capture**: among cases annotated `needsHumanReview: true`, report fraction resulting in `review-suggested` or `human-review`, and separately stricter `human-review` rate. Explain this tests a human annotation, not an objective clinical/security standard.
- **False-auto count**: annotated human-review-required cases that the policy routed to `auto`.
- For annotated security-sensitive cases, report fraction flagged with policy `securityReviewRequested` and human-review mode, noting that binary annotations are subjective. Do not call this a verified vulnerability detector score.

### D. Probabilities and confidence

- Average/median of **selected-option probability** (per choice dimension) over valid successful records.
- Average/median of **reported choice confidence** separately; never aggregate it under the same label as selected probability.
- Average/median security and needs-review **P(YES)** separately, ideally split by annotated yes/no cohort where helpful.
- Optional bin table by policy's existing `overallChoiceGateScore`, with counts, observed category correctness and interval boundaries; label as small-sample exploratory reliability, not proven calibration.
- If adding calibration/Brier/ECE, define exact target/outcome and binning assumptions and document small-sample limits; do not use an ill-defined confidence calibration metric merely because it sounds impressive. Better to omit than misstate.

### E. Latency

- Offline fixture mode: show **evaluator processing duration** if measured, explicitly separate from provider latency. `Jev latency = N/A`.
- Live Jev mode: report observed `TriageResult.meta.latencyMs` or actual existing timing contract for successful calls; average, median and p95 (document exact nearest-rank/interpolation method). Do not invent a provider latency for skipped/failed calls.
- If live provider call fails after a measured attempt, record a separately named failed-attempt duration if available, but don't silently mix it into successful inference latency.
- Distinguish SDK/API internal retries from **one analyzer invocation per record**; provider transport may make more than one physical HTTP attempt under SDK retry policy.
- Never hard-code official vendor latency/price claims as results of JevFlow's test.

---

## 8. CLI and scripts — explicit, non-surprising behavior

Provide a simple cross-platform command consistent with existing npm CLI style:

```text
npm run eval -- --help
npm run eval -- --mode fixture
npm run eval -- --mode fixture --format json
npm run eval -- --mode fixture --output evals/results/latest.json
```

The **default must be fixture/offline mode**. If syntax differs, document it clearly and test it. Treat unknown flags, invalid mode, invalid dataset path and unsafe output paths as errors with sanitized output. `--help` must require neither API key nor network.

Add a deliberately explicit live mechanism. For example:

```text
npm run eval -- --mode live --confirm-live
```

Additional rules:

1. `--mode live` **without** `--confirm-live` must refuse before any network or key lookup and explain that up to 30 provider calls may incur charges. Never automatically set that flag in tests, CI or other npm scripts.
2. A configured `TYPESAFE_API_KEY` is required only for the explicitly confirmed real run. Don't print key values.
3. Even if credentials exist, Codex must **not execute** live mode unless the **user explicitly authorizes it in the current session**. The Markdown instruction itself is not authorization.
4. Support `--limit N` for a small controlled live smoke (e.g. 1–3 cases) and document it, with the full-dataset option intentional rather than accidental.
5. Clearly identify results as `live-jev` only when the real analyzer actually ran and returned results. Never silently fall back from live to fixture results after an API failure.
6. Do not ask for a GitHub token: evaluation operates on local synthetic cases, not live GitHub issues.
7. If results are written to disk, use unique timestamp/explicit user-selected names, safe path handling and avoid secret/raw issue content. Ignore generated `evals/results/*.json` / `*.md` by default while retaining `.gitkeep` and relevant README.

Script examples (adapt to project tooling):

```json
{
  "scripts": {
    "eval": "tsx src/cli/evaluate.ts",
    "eval:fixtures": "tsx src/cli/evaluate.ts --mode fixture"
  }
}
```

Do not include `eval --mode live` in `npm run check`, CI or any automatically run task. The evaluation CLI must exit nonzero on invalid data/config, and clearly report per-case failures on completed runs.

---

## 9. Reports, reproducibility and truthful sample output

Implement an output layer producing:

### Machine-readable JSON report

Include at least:

```text
schemaVersion
mode (offline-fixture or live-jev)
datasetVersion / datasetCount
startedAt / completedAt
application thresholds used (not secrets)
run accounting (total/succeeded/failed/skipped)
metric definitions/denominators or structured numerator/denominator fields
per-issue ID, predicted labels, annotated labels, policy mode, reason codes
separate selectedProbability vs reportedConfidence vs P(YES)
latency kind (evaluator-only vs live-provider)
error code for any failed record; no raw provider error body
```

Only show fields actually known. Ensure JSON serializes without `NaN`, `Infinity`, circular objects, `undefined` masquerading as null, or raw SDK response dumps.

### Human-readable Markdown report

Include:

- Report heading and explicit **OFFLINE SYNTHETIC** or **LIVE Jev** mode.
- Dataset and methodology overview (including manual annotations and small sample size).
- Counts and denominators for classification, automation modes, human-review behavior and security-relevant cohort.
- Confidence/probability table with precise labels.
- Latency section truthful to the mode.
- Brief limitations and next steps.
- No best/worst marketing claims, no asserted provider speed/accuracy from fixture data, no secrets and no personal data.

Generated reports are local artifacts, not required to be committed. Commit the generator, dataset and docs. Include one small **clearly labeled illustrative/report-format example** only if useful; never label an offline synthetic report as real provider performance.

---

## 10. Required test matrix (offline and meaningful)

Use the existing Vitest setup. Every test must run with no credentials, no network and no live GitHub repository. Aim for meaningful coverage of the new evaluator plus regression protections for Tasks 01–04; do not assert an arbitrary test-count target or weaken previously passing tests.

### Dataset / annotation validation

1. Exactly 30 unique stable IDs, valid schema/version and supported labels.
2. Valid expected boolean annotations, rationale and optional alternatives.
3. Every fixture maps to one known record ID; no duplicates/unknown IDs/missing fixtures.
4. Missing title/body, malformed JSON, duplicate IDs and unsupported expected values fail predictably.
5. Unicode, newline, empty body and input truncation cases handled safely.

### Metrics math

6. Strict classification accuracy with known constructed examples (correct numerator/denominator).
7. Acceptable alternative area accuracy is distinct from strict accuracy.
8. Exact-all-three classification count; failures/skips excluded from success denominator and still counted in accounting.
9. Zero denominators yield N/A/null and reports serialize cleanly.
10. Auto/review/human proportions sum correctly for successfully evaluated cases.
11. False-auto and annotated-human-review capture use correct cohorts.
12. Security review metrics use human annotation separately from model P(YES).
13. Choice `selectedProbability` and distinct reported `confidence` are never conflated.
14. Binary P(YES) is not treated as classification confidence or converted to a confirmed security finding.
15. Average/median/p95 latency math is correct for odd/even arrays, missing values and tiny sample sizes.

### Policy, labels and integration regression

16. Exact threshold boundaries and above/below cases retained from Task 03.
17. Critical priority, security P(YES), human-review P(YES) and truncation overrides remain monotonic.
18. `human-review` cases don't receive speculative category labels; low-category review cases omit category labels as documented.
19. Only canonical label names appear; mode labels are mutually exclusive.
20. Repeated label reconciliation preserves user labels and sticky `security-review` (use the existing Task 04 injected fake).
21. A fake issue event can go through the Task 04 orchestrator and report correct actions; no real Octokit call.
22. An injected provider failure triggers documented fail-safe behavior without invented predictions.

### Execution and safety

23. Fixture mode never invokes `analyzeIssue`'s real provider, even if environment contains an API key.
24. `--help`, invalid argument, malformed dataset and `--mode live` without confirmation cause zero network calls.
25. Confirmed live mode routes to the existing analyzer via dependency injection in tests, using a fake; do not actually invoke network during testing.
26. Per-case failures are included and don't falsely improve accuracy.
27. JSON and Markdown clearly label fixture vs live mode and never leak issue body, secrets or raw SDK exceptions.
28. Repeated fixture run against same fixed inputs/config produces stable metrics/per-record decisions (timestamps or measured evaluator duration may differ; compare stable subsets).
29. Existing Task 01–04 suites continue passing and existing bootstrap/local triage `--help` remain safe.

Use test-generated temporary files (OS temp directory) for report-writing tests; cleanup only files the tests created. Avoid snapshots containing tokens, issue text or personal data. Don't rely on real TypeSafe or GitHub availability for a green test run.

---

## 11. Optional CI integration — never paid/network

The existing Task 01 CI uses `npm ci` and `npm run check`. Ensure the new tests are covered by it. If you add a separate evaluation workflow, it must:

- run on appropriate push/PR or **manual dispatch only** for fixture tests;
- run **only offline fixture mode**, without secrets;
- use least privileges (`contents: read`);
- not call live Jev/GitHub APIs;
- not publish full issue texts or credentials;
- fail if dataset invalid, fixture coverage incomplete or metrics checks fail.

A separate workflow is **optional**; prefer keeping the two-day MVP simple. Never add a scheduled or PR-triggered live benchmark with a provider key. The existing Task 04 triage workflow should not trigger evaluation runs on each issue.

---

## 12. Documentation to update

Update only accurate content:

- `README.md`: explain the evaluation capability, fixture vs live modes, safe commands and report location. Clearly state which modes have actually been run.
- `docs/evaluation.md`: annotation process, case distribution/cohorts, metric formulas/denominators, limitations, how to interpret model probability and reported confidence, live-run opt-in and any provider billing concerns.
- `evals/README.md`: dataset layout and schema version, synthetic fixture provenance, manual editing/review rules, how to extend dataset without altering old labels silently.
- `evals/annotation-guide.md`: category/priority rubric, ambiguity/acceptable-alternative policy, boolean security/review annotation criteria, rationale requirements, review/revision process.
- `docs/architecture.md`: include evaluation pipeline and clarify no GitHub side effect.
- `docs/development.md` / `docs/codex-workflow.md`: only small necessary additions; preserve Setup and Tasks 01–04 instructions.
- `docs/roadmap.md`: mark Task 05 complete only when implemented, validated and safely merged. Otherwise mark in-progress/blocked truthfully.
- `.gitignore`: generated results and transient files ignored; keep committed dataset, fixtures and scripts visible.

Do not claim a measured Jev benchmark until an authorized real run exists, and never copy an unsupported accuracy/latency figure into the README.

---

## 13. Execution order for Codex

1. Read `AGENTS.md`, this entire prompt and all actual Task 01–04 contracts.
2. Confirm source repository, baseline tests and Git state; create/reuse `test/evaluation-suite` safely.
3. Design typed dataset schema, annotation guide and 30 synthetic records; cross-check taxonomy and rationales.
4. Add rigorous dataset validation and matching synthetic normalized fixtures.
5. Implement pure metric helpers with explicit denominator/count contracts and safe zero-denominator behavior.
6. Implement runner with injected fixture/live analyzer source; mode and permission gating must precede any provider/client initialization.
7. Add evaluation CLI, sanitized JSON/Markdown reports and ignore rules for generated outputs.
8. Add offline tests, threshold/label/GitHub regression checks and report serialization tests.
9. Update docs/roadmap accurately; avoid broad reformatting of task prompt files or unrelated code.
10. Run fixture evaluation and all required quality checks; inspect the report's mode and counts. Fix real failures.
11. Review diff, secret exposure, generated-file status and package-lock changes (if any); commit verified Task 05 files.
12. Merge safely to `main` only after all checks pass, re-run checks, report exact status, and **STOP**. No Task 06/07 implementation.

Do not request live API testing merely to finish this phase. Offline completion is the main deliverable. If a live test would be useful, present the optional command for the user's later explicit approval without executing it.

---

## 14. Validation commands and factual reporting

Run these (adapt to the real npm script names and host shell when needed):

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run eval -- --help
npm run eval -- --mode fixture
npm run eval -- --mode fixture --format json
npm run triage -- --help
npm run dev
npm start

git diff --check
git status --short
git diff --stat
```

If an output script has a short-lived option, use it and exit gracefully. Verify the generated artifact says `offline-fixture`. `npm run check` and CI must not make a live Jev request. Do not execute `--mode live --confirm-live` without explicit current-session approval, even if an API key is already present. If the repo lacks tools/credentials, say `NOT RUN/BLOCKED` with a reason, not `PASS`.

Suggested commit:

```text
test: add reproducible JevFlow evaluation and benchmark harness
```

For safe branch and clean worktree, intended merge is approximately:

```bash
git status
git diff --check
git add <only reviewed Task 05 files>
git diff --cached --check
git commit -m "test: add reproducible JevFlow evaluation and benchmark harness"
git switch main
git merge --no-ff test/evaluation-suite
npm run check
git status --short
```

Never force push, overwrite another person's work or silently clean untracked files. Do not claim a GitHub-hosted CI run passed unless you actually observed that run.

---

## 15. Mandatory acceptance criteria

- [ ] Main JevFlow repository is used; disposable repo is untouched.
- [ ] Setup + Tasks 01–04 intact and existing project tests still pass.
- [ ] Exactly 30 reviewed synthetic dataset cases with canonical annotations and rationales.
- [ ] Dataset/fixture validation catches invalid/duplicate/incomplete records.
- [ ] Fixture mode is fully offline and explicitly labeled synthetic.
- [ ] Existing `analyzeIssue`, policy and label mapper are reused; no competing Jev implementation.
- [ ] Metrics define explicit denominators, cohort selection and zero-denominator treatment.
- [ ] Strict/acceptable-answer classification, auto coverage, escalation, false-auto and security-review measures are computed correctly.
- [ ] Separate selected-choice probability, reported confidence, binary P(YES) and live provider latency meanings remain preserved.
- [ ] JSON and Markdown reports are valid, safe and reproducible in their stable fields.
- [ ] Live option is gated with both CLI confirmation and current-session user authorization; no hidden paid request.
- [ ] Evaluation never labels/issues/comments on real GitHub.
- [ ] Meaningful offline evaluator and regression tests pass, including Tasks 01–04.
- [ ] `npm run check` and any CI remain offline.
- [ ] Docs clearly identify synthetic fixtures vs real observed provider performance.
- [ ] Git diff, secret checks, commit/merge state and optional live-test status factually reported.
- [ ] Task 06 dashboard and Task 07 release work have not been implemented.

---

## 16. Required final response from Codex

Report actual observed information, not an optimistic summary:

```text
JevFlow — Task 05 Implementation Report

Repository and branch: ...
Task 01–04 baseline: PASS / FAIL / NOT RUN (reason)

Implemented:
- Dataset version/count and scenario cohorts
- Annotation guide and validation
- Fixture runner and explicit live gate
- Metric formulas and report formats
- New/regression tests and relevant docs

Observed offline fixture evaluation:
- Executed cases / total: ...
- Classification results (numerator/denominator): ...
- Auto/review/human counts: ...
- False-auto / annotated review capture: ...
- Report output path and mode flag: ...
- Note: synthetic fixtures; NOT live Jev accuracy

Validation:
- format:check ...
- typecheck ...
- lint ...
- npm test ... (actual test count)
- build ...
- check ...
- eval --help ...
- fixture evaluation ...
- existing CLI/bootstrap ...
- diff/secret review ...

Live Jev benchmark: NOT RUN unless explicitly authorized and actually observed.
Files changed: ...
Commit hash: actual hash or blocker
Merge to main: YES / NO with reason
Working tree: CLEAN / DIRTY with details
Push: NOT PERFORMED unless separately authorized/verified
Outstanding limitations/blockers: ...
Next: Task 06 — Web Playground & Decision Dashboard (optional)
```

**EXECUTE TASK 05 ONLY AND STOP. Do not build the dashboard or start Task 07.**
