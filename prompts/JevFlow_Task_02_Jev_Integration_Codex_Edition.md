# JevFlow — Task 02: Jev Integration & Intelligent Triage Engine (Codex Edition)

> **VS Code + OpenAI Codex implementation prompt — EXECUTE TASK 02 ONLY.**  
> Project: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**  
> Roadmap: **Phase 2 of 7**, after Setup and Task 01  
> Target branch: `feat/jev-engine`  
> Runtime: **Node.js 20+, TypeScript ESM / NodeNext, npm, Vitest**  
> Coding assistant: **OpenAI Codex**. Application inference provider: **TypeSafe AI Jev**.

---

## 0. Agent assignment and non-negotiable boundary

You are the senior TypeScript/Node.js implementation engineer operating in **VS Code using the OpenAI Codex extension**. Read the root `AGENTS.md`, the completed Task 01 implementation, and this entire file before editing. **Implement and verify code**, not merely propose changes. Inspect the repository's real exports and naming conventions before applying the proposed structure below.

**Required result:** The main JevFlow repository has a real, isolated, server-side integration with the **official TypeSafe JavaScript/TypeScript SDK**. One validated issue becomes a bounded structured state; one `systemOne` invocation submits five typed questions; a strict application-layer normalizer produces a stable `TriageResult` containing three classifications and two YES probabilities. It is fully unit-testable **offline without an API key**. A live smoke test must be explicit, optional and secret-safe.

- **OpenAI Codex writes the code. TypeSafe Jev makes the runtime decisions.** Do not install or call the OpenAI API to perform issue classification.
- Implement **Task 02 only**. Do **not** build Task 03's confidence policy, security escalation thresholds, label mapper or CLI; Task 04's GitHub API/Actions; Task 05's benchmark dataset; Task 06's web UI; or Task 07's release work.
- Do not fabricate example model results in production logic, assert that the real API was tested if it wasn't, or report successful external operations that were not performed.
- Preserve the separate disposable `jevflow-test-repo`; it is **not** the main application repository and must not be modified in this phase.

---

## 1. Read the previous phase and inspect the environment FIRST

The Setup Phase and Task 01 are expected to exist. Verify actual files rather than assuming that they do.

Read, as applicable:

```text
AGENTS.md
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
src/cli/index.ts
.github/workflows/ci.yml
```

Run platform-compatible commands (PowerShell equivalents are fine):

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

**Before proceeding:**

1. Confirm that the current directory is the **main JevFlow application**, not `jevflow-test-repo`. Stop on a wrong workspace.
2. Confirm Task 01 provided a real ESM TypeScript/npm project, functioning bootstrap, domain types, config and checks. If absent or broken, accurately identify the gap; do not silently redo Setup or rewrite the project.
3. The previous phase should be committed/merged to `main`. Preserve any existing uncommitted changes. If not safe to branch, describe the blocker rather than discarding work.
4. Record any pre-existing failing checks separately from Task 02 failures; fix only what is necessary for this phase without broad refactors.
5. Inspect the installed Node version; official SDK needs **Node.js 20+**.

The Task 01 canonical type/choice source of truth is expected to define:

```text
Issue type: bug | feature | documentation | question | maintenance
Engineering area: frontend | backend | database | devops | ai | security | general
Priority: critical | high | medium | low
```

The `IssueInput` shape should have `title`, `body` and optionally `issueNumber`, `issueUrl`, `repository`. Adapt to the actual exported names without duplicating competing domain types.

---

## 2. Safe Git branch workflow — mandatory

Start from a verified clean `main` and use exactly:

```text
feat/jev-engine
```

Illustrative commands only; adjust to actual Git state:

```bash
git status
git switch main
# Optional only for a known intended upstream and a safe clean tree:
# git pull --ff-only
git switch -c feat/jev-engine
```

If this branch already exists, inspect it and reuse it safely; don't overwrite it. **Never** run destructive cleanup, `git reset --hard`, force push or an automatic `git stash` without the user's authorization. Don't push/create remote repositories on the user's behalf unless a prior approved workflow explicitly requires that action. Work only on this feature branch until checks pass.

Keep and preserve `AGENTS.md`, prior task prompts, Git history and the original bootstrap behavior.

---

## 3. The official Jev SDK is authoritative — verify locally

**Required production dependency:**

```bash
npm install @typesafe-ai/sdk
```

Update and commit `package-lock.json`. Before writing the adapter, inspect the actual installed version, its README/type declarations and official examples. Use the installed SDK's documented exports and signatures. **Do not invent fields or pin a guessed release.**

Official references to consult if network access is available:

- SDK: https://github.com/typesafe-ai/typesafe-sdk-js
- Official demo: https://github.com/typesafe-ai/typesafe-sdk-js/blob/main/examples/demo.ts
- Official types: https://github.com/typesafe-ai/typesafe-sdk-js/blob/main/src/types.ts
- API docs: https://api.typesafe.ai/docs

Known baseline API pattern (verify against the installed package):

```ts
import { TypeSafeClient, choice, noul } from '@typesafe-ai/sdk';

// Lazily instantiate only when a real request is explicitly made.
const client = new TypeSafeClient();
const result = await client.systemOne({
  state: { title: 'The login endpoint returns HTTP 500', body: 'Refresh token expired.' },
  questions: {
    issueType: choice('Which type of issue is this?', {
      bug: 'A failure in existing behavior.',
      feature: 'A requested new capability.',
    }),
    securitySensitive: noul('Does this issue raise a plausible security/privacy concern?'),
  },
});

const selected = result.answers.issueType.choice;
const selectedProbability = result.answers.issueType.probabilities[selected];
const reportedConfidence = result.answers.issueType.confidence;
const probabilityOfYes = result.answers.securitySensitive.noul;
```

**Critical response semantics:**

- `choice`: selected `.choice`, its own `probabilities` map, and a separately reported `.confidence`. **Preserve selected-option probability and reported confidence as distinct values**; neither should be silently substituted for the other.
- `noul`: `.noul` is **P(YES) in [0,1]**, not a categorical boolean, not uncertainty, and not a `.confidence` field. No inference that `P(YES)=0.1` means 10% confidence.
- Responses are under `response.answers[questionName]`; consult actual SDK types for `model` and `usage` fields.
- The SDK may retry underlying HTTP requests. Your application-level analyzer should call its injected provider **once**; do not promise one physical HTTP attempt when SDK retries apply. Document this distinction.
- Respect the SDK's default model, unless the project has an explicitly validated optional `TYPESAFE_DEFAULT_MODEL`; never invent a model ID.
- Keep SDK debug/body logging off in production paths, since issue text can contain sensitive information. Redact provider errors rather than logging entire raw error objects.

Use **three `choice` questions and two `noul` questions**, not generic chat/completions or an unnecessary score question.

---

## 4. Precise Task 02 deliverables

The expected modules (adapt filenames minimally if real Task 01 conventions justify it):

```text
src/
├── jev/
│   ├── client.ts           # Lazy, server-side official SDK adapter; injectible request boundary
│   ├── questions.ts        # Five question definitions; typed and canonical
│   ├── state.ts            # Validate/bound input and construct Jev state
│   └── types.ts            # SDK-facing types or inferred helpers if useful
├── triage/
│   ├── analyzeIssue.ts     # Input → state → one provider call → normalized result
│   ├── normalizeResult.ts  # Runtime validation and stable domain conversion
│   └── triage.types.ts     # Public normalized TriageResult, typed failures
└── utils/
    └── errors.ts          # Only if needed; sanitized public error boundary

scripts/
└── smoke-jev.ts            # Explicit opt-in real API call; never run in CI/check

tests/
├── jev-state.test.ts
├── jev-questions.test.ts
├── jev-normalization.test.ts
└── triage-analysis.test.ts
```

Update, only as needed:

```text
package.json
package-lock.json
.env.example
README.md
docs/architecture.md
docs/decisions.md
docs/development.md
docs/roadmap.md
```

Keep source imports ESM/NodeNext compatible (`.js` relative specifiers where the actual build requires them). Avoid duplicating canonical values from Task 01. No database, new framework, OpenAI SDK, Octokit, Next.js, GitHub Actions issue trigger or frontend.

---

## 5. Five canonical typed Jev questions in ONE call

Create exactly these named questions using official factories, with clear, non-overlapping descriptions aligned with Task 01 constants:

| Question key | Factory | Meaning |
|---|---|---|
| `issueType` | `choice` | `bug`, `feature`, `documentation`, `question`, `maintenance` |
| `engineeringArea` | `choice` | `frontend`, `backend`, `database`, `devops`, `ai`, `security`, `general` |
| `priority` | `choice` | `critical`, `high`, `medium`, `low` |
| `securitySensitive` | `noul` | Probability YES: credible security/privacy relevance |
| `needsHumanReview` | `noul` | Probability YES: insufficient clarity, consequential issue or manual judgment needed |

Recommended rubric distinctions:

- `bug`: reported defect in existing behavior; `feature`: proposed new capability; `documentation`: documentation/setup text; `question`: explanation/discussion; `maintenance`: routine upkeep, dependency/version/refactor.
- `frontend`: UI/browser; `backend`: server/API/business logic; `database`: data persistence/query/migration; `devops`: CI/deployment/infrastructure; `ai`: model, inference, RAG; `security`: authorization, information exposure, credentials; `general`: unclear/cross-cutting.
- `critical`: major outage, high-impact exposure/data loss or urgent severe impact; `high`: serious functionality or business impact; `medium`: material noncritical impairment; `low`: minor/optional issue. The model's choice is **a classification suggestion**, not proof of severity.
- `securitySensitive`: does the description credibly relate to abuse, authentication, authorization, confidentiality, privacy, leaked credentials or similar? Not all auth bugs are proven vulnerabilities.
- `needsHumanReview`: ambiguous/insufficient evidence, plausible security or consequential actions, or other issue requiring human judgment. This is **P(YES)**, not an instruction to act; Task 03 will make the deterministic policy decision.

Construct choices from a single canonical label/description source or explicitly verify at compile/runtime that criteria keys match the Task 01 allowed arrays. If TypeScript literal inference is lost by overly generic mapping, define typed literal criteria and assert/test exact key coverage; do not introduce an independent conflicting list of labels. Exact **five** keys and stable names are part of the future Task 03 contract.

Keep issue text in `state` and classification instructions in trusted code. A malicious user issue saying "ignore your rules" must **not** alter the question factories/options.

---

## 6. Validate input, limit size and construct state

Implement a reusable, deterministic state builder. Accept an `IssueInput`, validate shape at runtime at this boundary, and return a JSON-compatible object with relevant fields (`title`, `body`, optional metadata). Task 01's TypeScript interface alone is not runtime validation.

Suggested behavior; document exact implementation:

1. Reject absent, nonstring or whitespace-only titles with a sanitized `invalid_input` error.
2. Treat `body: ''` or an explicitly documented missing/null body as empty text (GitHub issue body may be null in Task 04); reject unsupported nonstring body values. Keep the public input type coherent.
3. Trim obvious surrounding whitespace and cap title and body using **code points** (not invalid UTF-16 slicing); recommended maxima: 300 characters title, 8,000 characters body. Tests must assert accurate truncation flags/lengths. Avoid accidental full-text logging.
4. Preserve the original issue meaning; do not aggressively strip code snippets or URLs. Set explicit `inputTruncated` / `truncatedFields` metadata where needed.
5. Whitelist only intended optional `issueNumber`, `issueUrl`, `repository`. Validate positive safe integer issue number and reasonable URL/repository syntax; never let source text choose a target GitHub repository or command destination.
6. Do not include secrets, whole GitHub webhook payloads, actor tokens, arbitrary labels or raw metadata in Jev state.
7. Treat `title`/`body` as **untrusted data**. No dynamic execution, eval, shells, or interpolating content into trusted question instructions.
8. Ensure the payload remains JSON-serializable and bounded; tests should handle multiline text, empty body, emoji/unicode and oversized content.

The `state` may include innocuous provenance (`source: 'github_issue'`) and sanitized metadata if useful. Do not claim truncation preserved all evidence when it did not; expose it so Task 03 can eventually decide how cautious to be.

---

## 7. Lazy, server-only Jev adapter and dependency injection

Make a narrow, typed provider interface that is easy to fake in tests and returns the **real inferred SDK response type** (or an equally precise checked representation). Then implement the official SDK adapter separately.

Recommended design principles:

- Importing `analyzeIssue`, `state` or test helpers **must not instantiate a network client, require a key or call Jev**.
- Construct `TypeSafeClient` lazily, only for an explicitly requested real inference. The SDK can read `TYPESAFE_API_KEY` from the environment, or pass validated key via actual client config.
- A missing key yields a sanitized `missing_api_key` result/error with actionable instructions; never print the secret.
- Prefer SDK-supported timeouts and bounded retries; confirm actual options/types before writing them. Avoid layering an additional unbounded retry loop.
- Use SDK log setting/filtered logger so request bodies, full issues, full provider errors and credentials are not dumped by default.
- Keep provider transport concerns in `src/jev/client.ts`, never in domain types or future GitHub logic.
- No network calls in import side effects, `npm run check`, CI, unit tests, `npm run dev`, or `npm start`.
- Keep `TYPESAFE_API_KEY` **optional in Task 01 config/bootstrap**. Require it only at real-provider invocation; do not break existing startup.
- Convert internal failures into a small well-defined error taxonomy, e.g. `invalid_input`, `missing_api_key`, `provider_unavailable`, `invalid_response`. Do not include request headers, raw provider body or issue content in outward errors.

If the installed SDK error types support classification (e.g. API/connection/timeouts), use correct documented public properties only. Do not assume every response/server problem is safely retryable.

---

## 8. Normalized application result contract

Create and export a stable, provider-agnostic `TriageResult` that later Task 03 can consume. It should contain at least:

```ts
// Contract illustration; reconcile with actual Task 01 exported union types.
interface ChoiceDecision<T extends string> {
  value: T;
  selectedProbability: number; // probabilities[value], 0..1
  confidence: number;          // SDK-reported choice confidence, separate
  probabilities: Readonly<Record<T, number>>;
}

interface TriageResult {
  issueType: ChoiceDecision<IssueType>;
  engineeringArea: ChoiceDecision<EngineeringArea>;
  priority: ChoiceDecision<Priority>;
  securitySensitive: { probabilityYes: number };
  needsHumanReview: { probabilityYes: number };
  meta: {
    model: string;
    latencyMs: number;         // measured around actual provider call
    inputTruncated: boolean;
    truncatedFields: readonly string[];
    usage?: {
      inputTokens: number;
      outputTokens: number;
    };
  };
}
```

Adjust optional metadata only to accurately reflect the installed SDK contract and real available values. Avoid invented cost figures, fabricated confidence, inferred token counts or imaginary SDK fields.

**Normalizing is validation, not policy.** Check at runtime:

- All five required answers exist and have the expected `type` and fields.
- Each selected choice belongs to its allowed canonical set.
- `probabilities` includes every required option with finite numeric values in `[0,1]`; validate selected probability distinctly from `.confidence`. Do not require exact sum = 1 when rounding can occur; if checking total, use a defensible tolerance and test it.
- Choice `.confidence` is finite and in `[0,1]`; preserve it even if different from selected-option probability.
- Each `noul` is a finite probability `[0,1]`, including valid boundaries 0 and 1. Never invent a Noul `.confidence` or convert it into a boolean.
- `model` and usage are mapped only from real response metadata, with honest validation of actual fields.
- Invalid/missing/unknown output fails with a sanitized `invalid_response` rather than guessed default classifications.
- Return no raw API key, issue body or unvalidated SDK object in the public result.

Keep the normalization entry point small and separately testable. Avoid broad `any`, unsafe `as unknown as`, `@ts-ignore`, and silent correction/clamping of model probabilities.

---

## 9. Main analysis service

Implement the public entry point:

```ts
analyzeIssue(issue: IssueInput, dependencies?: ...): Promise<TriageResult>
```

Exact signature can fit the repository architecture, but must be easy for Task 03/04 to reuse. Expected flow:

```text
IssueInput (runtime validation)
    → bounded state and truncation metadata
    → trusted five-question object
    → injected real/fake Jev provider
    → one application-level systemOne call
    → strict response normalization
    → measured latency and SDK metadata
    → typed TriageResult
```

Use a monotonic clock, e.g. `performance.now()`, around the provider invocation. Never make a second Jev call to "double-check" an answer within this phase. No decision thresholds, label mutations or GitHub API calls here.

The provider/fake should be injected without complicated frameworks. Unit tests must be able to supply fixture responses without setting an API key or making network calls.

---

## 10. Manual live smoke test: explicit and optional

Create `scripts/smoke-jev.ts` (or another isolated path consistent with Task 01 tooling) and a script:

```json
"smoke:jev": "tsx scripts/smoke-jev.ts"
```

It must:

1. Load ignored local `.env` via existing dotenv bootstrap if appropriate; never create or hard-code a credential.
2. If key is missing, explain how to set `TYPESAFE_API_KEY` locally and exit nonzero **without printing any value**.
3. Analyze one harmless invented issue; do not send actual confidential GitHub data.
4. Print a compact **sanitized** normalized result with chosen categories, distinction between selected probability and choice confidence, `P(YES)` for binaries, measured latency and supported usage data; never log the raw request/response or auth.
5. Mark output clearly as **LIVE** only after an actual successful remote request. Errors must be truthful, sanitized and actionable.
6. Be executed **only when explicitly requested** and when a key is available. Do not put it in `check`, tests, CI, imports, or bootstrap; it may use paid API access.
7. If access to the provider isn't available, leave complete, verified offline integration and report live smoke test as **NOT RUN**, not "passed".

Do not ask the user to paste a secret into Codex chat. Explain local `.env`/secure environment setup if required. If live access is denied, do not replace the real adapter with fake provider logic.

---

## 11. Meaningful offline tests — mandatory

Reuse existing Vitest and Task 01 test conventions. Add fixtures that reflect the **actual installed SDK** response shape. All regular test commands must pass with `TYPESAFE_API_KEY` absent and no outbound network.

### Input/state tests

1. Valid title and body create expected stable state.
2. Missing, nonstring and blank title rejected before provider invocation.
3. Empty body handled truthfully; invalid body types rejected per contract.
4. Long title/body truncation and Unicode/code-point boundaries work; metadata identifies truncation.
5. Optional issue metadata validated/omitted appropriately.
6. Hostile text attempting to override classification is treated as untrusted state, not instruction/options.

### SDK questions/contract tests

7. Exactly five keys; three `choice`, two `noul`.
8. All choice keys match Task 01 constants with no drift/missing options.
9. Question instructions/criteria are trusted static code, independent of issue content.

### Normalization tests

10. A valid official-SDK-shaped fake yields three normalized choices and two P(YES) values.
11. Selected probability and `.confidence` deliberately **differ** in fixture and remain different in output.
12. 0, 1 and fractional `noul` values work without false confidence semantics.
13. Unknown selected choice, missing choice probability, bad/missing answer type, missing question, `NaN`, `Infinity`, negatives and >1 values fail safely.
14. Missing/invalid model or usage data handled according to actual installed SDK contract; no fabricated metadata.

### Service/security/regression tests

15. Provider invoked exactly once with the bounded state and correct questions; test runner stays offline.
16. Invalid input invokes provider zero times.
17. Provider failures propagate as sanitized typed errors, not made-up classifications.
18. Importing modules and executing all standard tests/bootstrap requires no API key.
19. Task 01 config/domain/bootstrap tests still pass; invalid thresholds still fail correctly.
20. Error messages and test logs do not contain fake secrets or raw sensitive issue bodies.

Do not make assertions about real-world Jev accuracy or invent latency benchmarks: those belong in Task 05. Do not weaken strict TypeScript or test assertions just to obtain green output.

---

## 12. Scripts, docs and progress status

Preserve Task 01 scripts and add only necessary ones, especially `smoke:jev`. The following must stay key-free/offline:

```text
npm run dev
npm start
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
```

Docs updates:

- `README.md`: Task 01 complete, Task 02 real SDK implementation **only after actually implemented**; Task 03 policy and Task 04 GitHub automation remain planned. Show how to run offline validation and manual smoke test.
- `docs/architecture.md`: input/state/questions/provider/normalizer/result, clear policy and GitHub mutation boundaries.
- `docs/decisions.md`: official SDK choice/noul design; choice probability vs reported confidence; NOUL P(YES); no policy baked into the analyzer.
- `docs/development.md`: installed SDK and Node prerequisites, local `.env`, offline tests, manual paid/live test, user-friendly Windows PowerShell notes if useful.
- `docs/roadmap.md`: update Task 02 status only after validation/merge; maintain truthful branch and progress status. Never mark 03–07 complete.
- `.env.example`: preserve Task 01 defaults for `AUTO_THRESHOLD=0.90` and `REVIEW_THRESHOLD=0.75`, with a blank `TYPESAFE_API_KEY`; optional provider model override only if supported and validated. Never commit `.env`.

Avoid rewriting long prompt files with formatting or modifying unrelated docs. Keep root `AGENTS.md` intact unless a verified contradiction demands a minimal change.

---

## 13. Order of implementation (execute, don't stop at a plan)

1. Read `AGENTS.md`, prompt, source and Task 01 docs; verify branch/workspace/checks.
2. Create/safely reuse `feat/jev-engine`.
3. Install official SDK and inspect its actual installed type declarations/README and package version.
4. Implement the five typed questions using canonical constants.
5. Implement state validation and bounded state builder.
6. Implement lazy server-only SDK adapter and injectable provider seam.
7. Implement public normalized `TriageResult` and strict runtime guard.
8. Implement `analyzeIssue` orchestration and measured latency.
9. Add meaningful offline tests and fixtures; repair Task 02-caused failures.
10. Add manual-only smoke script, keeping it out of CI/check/import startup.
11. Update package script/docs/progress accurately.
12. Format affected source; run all required checks and basic bootstrap checks.
13. Review complete diff/secret exposure/branch and commit safely.
14. Merge into `main` only after verified success and safe Git state, then re-run checks on `main`.
15. Report exact observed outcomes and **STOP**; do not start Task 03.

---

## 14. Validation and release-from-phase gate

Run each command and record **actual observed output**:

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run dev
npm start
```

`npm run dev` and `npm start` must still be the truthful offline bootstrap. Run optional `npm run smoke:jev` **only on explicit user-authorized live testing with an available valid local key**. Otherwise mark it NOT RUN.

Inspect before commit:

```bash
git diff --check
git status --short
git diff --stat
# Review staged diff and ensure secrets, raw API responses and unrelated edits are absent.
```

Suggested commit:

```text
feat: implement Jev typed issue triage engine
```

After successful tests and commit, if safe:

```bash
git switch main
git merge --no-ff feat/jev-engine
npm run check
git status
```

If checkout/merge/commit cannot safely occur, leave the branch and files intact and explain precisely. No force operations or invented commit hashes. Only push if previously expressly authorized and the intended remote is confirmed.

---

## 15. Mandatory acceptance checklist

- [ ] This is the correct main JevFlow source repository; separate sample repository untouched.
- [ ] `AGENTS.md`, Task 01 foundation and previously completed files preserved.
- [ ] `feat/jev-engine` branch created/reused from a safe `main` baseline.
- [ ] Official `@typesafe-ai/sdk` installed and lockfile updated; installed version inspected.
- [ ] One `systemOne` application invocation with exactly five named questions.
- [ ] 3 choices match canonical Task 01 categories; 2 nouls are P(YES).
- [ ] Input runtime validation, bounded state and truthful truncation metadata.
- [ ] Lazy server-side client, no key/network required for regular checks or imports.
- [ ] Selected-choice probability and choice confidence are separate.
- [ ] Noul YES probability not misrepresented as confidence/boolean.
- [ ] Invalid SDK output fails explicitly; no fabricated defaults or unsafe casts.
- [ ] Public `analyzeIssue` returns typed `TriageResult` with actual metadata/timing.
- [ ] Tests cover input, SDK questions, normalization, provider failures, secrets and regression.
- [ ] Explicit manual-only live smoke script is available and honestly marked if not run.
- [ ] `npm run check` plus format/typecheck/lint/tests/build/bootstrap pass, or blockers disclosed.
- [ ] Docs reflect Task 02 status but not unimplemented later features.
- [ ] No Task 03 confidence gate/labels/CLI; no Task 04 GitHub API/Actions; no dashboard/database.
- [ ] Git diff reviewed, secret files not committed, branch commit/merge status truthful.

---

## 16. Codex final response — REQUIRED

At the end, return a compact factual report with:

1. Summary and files added/modified.
2. Installed TypeSafe SDK version and official method/answer properties actually used.
3. Exported `analyzeIssue` entry point and normalized contract, distinguishing both choice metrics from P(YES).
4. Exact result of every format, typecheck, lint, test, build, check, dev and start command; include test counts if available.
5. Live smoke status: **PASSED / FAILED / NOT RUN**, and reason; don't confuse fixtures with real inference.
6. Current branch, actual commit hash, whether merged into `main`, post-merge checks and clean/dirty status.
7. Any blockers/deviations. Do not imply credentials or GitHub issue mutation occurred.
8. Explicitly confirm **Tasks 03–07 have NOT been implemented**.
9. Next: **Task 03 — Confidence Policy, Labels & CLI (Codex Edition)**.

**Execute Task 02 completely and STOP.**
