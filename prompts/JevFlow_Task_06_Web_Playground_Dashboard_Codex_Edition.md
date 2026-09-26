# JevFlow — Task 06: Web Playground & Decision Dashboard (Codex Edition)

> **Complete implementation prompt for VS Code + OpenAI Codex. EXECUTE TASK 06 ONLY.**  
> Product: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**  
> Roadmap: **Phase 6 of 7**, following completed Setup and Tasks 01–05  
> Target Git branch: `feat/demo-dashboard`  
> Target stack: existing Node.js 20+ / strict TypeScript ESM / npm / Vitest core, plus a minimal **Next.js App Router + React + TypeScript + Tailwind CSS** demo under `web/`  
> **OpenAI Codex is the implementation agent; TypeSafe AI Jev remains the application's only inference provider.**

---

## 0. Mission, success criteria and strict scope

Act as a senior full-stack TypeScript engineer, product UI designer and application security reviewer. You are running within the **OpenAI Codex extension in VS Code**. Read root `AGENTS.md`, this entire file, and the actual completed source and exports of Tasks 01–05 *before editing*. Implement and verify a polished, credible, interactive **web playground** for JevFlow, not just a static mockup. Execute code changes, tests and build checks in the current repository; provide a factual completion report.

**End state:** A visitor can inspect a tasteful JevFlow landing/playground, choose a clearly labelled synthetic sample issue or enter their own issue, use a deterministic **Preview Fixture** without any key or network inference, and—only when explicitly locally enabled—submit it to a server-side route that calls the **existing Task 02 analyzer + Task 03 policy + Task 03 proposed-label mapper**. The resulting UI accurately distinguishes typed choice selections, selected-option probabilities, separately reported choice confidence, two P(YES) measures, automation mode, reason codes, suggested labels, inference/processing metadata, and truncation. Task 05's *genuine existing* evaluation artifacts can be displayed with their provenance and denominator; do not invent benchmarks.

The optional visual layer must remain a presentation adapter. It **never** writes labels, updates issues, calls a GitHub mutation API, starts GitHub Actions or replaces Jev with a generative chatbot. Source/CLI/workflow/evaluation functionality from Tasks 01–05 must continue to work unchanged.

### Boundaries

| Reuse, do not duplicate | Implement now | Defer |
|---|---|---|
| Task 01 domain/config/scripts; Task 02 `analyzeIssue` + normalized `TriageResult`; Task 03 `evaluateTriagePolicy`, proposed-label mapper, thresholds/reasons; Task 04 GitHub automation; Task 05 evaluation dataset, metrics, report schema | Next.js `web/` app, server-side presentation adapter and guarded POST handler, sample/fixture preview, input form, decision cards/bars, human-review/status view, evaluation report view, accessible responsive styling, web tests, setup documentation | Task 07 final release polish/screenshots/public deployment planning, new Jev prompts/providers, database/auth, multi-user SaaS, PR triage and GitHub issue mutations from the browser |

**Never silently launch real inference**, including in development startup, test, dashboard preview, build/CI, or page load. A real Jev invocation must be explicitly initiated by the user after the required local configuration. Offline demo and evaluation data must be visibly described as fixture/synthetic or genuinely measured, respectively.

---

## 1. Preflight: inspect the real repository before choosing the integration mechanism

Read at minimum (only if present; use actual files as authority):

```text
AGENTS.md
prompts/README.md
README.md
docs/roadmap.md
docs/architecture.md
docs/decisions.md
docs/development.md
docs/codex-workflow.md
package.json
package-lock.json
.env.example
src/domain/
src/config/
src/jev/
src/triage/
src/policy/
src/github/
src/cli/
evals/ (or Task 05's actual directory)
tests/ and Task 05 evaluation reports
.github/workflows/ci.yml
```

Run platform-compatible commands; on Windows PowerShell use equivalent commands:

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

Confirm:

1. The workspace is **the main JevFlow product**, not the separate disposable `jevflow-test-repo`. STOP if the wrong repository is open.
2. Prior phases actually exist, especially the normalized result contract, policy/label exports, and Task 05's report format. Do not guess the export names from this brief; import the real ones.
3. `main` contains the prior verified work, or clearly report its real state. Record pre-existing failures before editing. Preserve user changes and prompts.
4. The root project is a working Node/ESM package. Inspect scripts/test exclusions so the new web directory does not break root typecheck, build, lint, or formatting.
5. No private issue text, real customer data, API keys or tokens are copied into public fixtures or rendered source.

### Required Git branch

Use `feat/demo-dashboard`, created from a verified, safe `main`, or inspect/reuse it if it exists. `git pull --ff-only` is optional only for a known intended upstream and a clean tree. **Never** run `git reset --hard`, `git clean -fd`, force push, unapproved stash, unsafe merge or automatic remote push. If user changes make safe branching impossible, preserve them and report the blocker.

```bash
# Illustration only—adapt to actual state:
git switch main
git switch -c feat/demo-dashboard
```

Do not alter the separate test repository or its remote.

---

## 2. Design and implementation decision: small web app, real shared core

Implement a new directory named `web/` using **Next.js App Router, React, strict TypeScript and Tailwind CSS**. Choose stable, mutually compatible versions using the current official documentation and the installed Node version. Do not pin guessed version numbers. Use a normal npm lockfile for the web package. Avoid Docker, a database, auth framework, global store, UI megaframework, GSAP and other complexity.

**Critical integration decision:** Reuse the existing JevFlow code as source of truth. Before scaffolding, inspect the actual root `package.json`, module format, `tsconfig`, `.js` specifiers and `TriageResult` exports. Select the *smallest buildable server-only shared-code strategy*, document it and verify `next build`. For example, a supported local package/shared server adapter with Next's `transpilePackages` if truly required, or a narrow server-only import that builds correctly. A direct relative import from the web tree is fine **only if** its TypeScript resolution, runtime and Next build are tested. Do not use unsupported legacy `experimental.externalDir` hacks just to silence the bundler.

Do not duplicate the Jev question schema, policy thresholds, normalization, label mapper or classification logic inside `web/`. Do not maintain a forked `analyzeIssue`. The UI consumes an explicitly defined **safe public projection** of the real existing result, not the raw SDK response. Make the dependency direction clear:

```text
web client components → same-origin POST /api/analyze
                    → server-only presentation adapter
                    → existing analyzeIssue (Task 02)
                    → existing evaluateTriagePolicy (Task 03)
                    → existing getProposedLabels (Task 03)
                    → allowlisted public UI result

web preview fixtures → local static preview adapter (NO Jev calls)
web evaluation page → existing Task 05 measured report, if present (read only)
```

If a local package or npm workspace is needed, add the minimum verified configuration and preserve root commands/CI. Do not restructure the full repository into a monorepo unless it is demonstrably necessary and regression-tested. Prefer straightforward `npm --prefix web ...` scripts or a verified equivalent. Ensure **both root and web have deterministic install/build instructions** and lockfiles. Update the root `.gitignore` to ignore `web/node_modules`, `.next`, web env files and web build artifacts without hiding task prompts/reports intentionally committed.

Official resources to consult when a detail is uncertain (check current docs at execution time):

- https://nextjs.org/docs/app
- https://nextjs.org/docs/app/getting-started/server-and-client-components
- https://nextjs.org/docs/app/guides/environment-variables
- https://nextjs.org/docs/app/api-reference/config/next-config-js/transpilePackages
- https://nextjs.org/docs/app/guides/testing/vitest

---

## 3. Recommended file structure (adapt to the working source tree)

```text
jevflow/
├── src/                         # existing core; preserve
├── evals/                       # existing Task 05 work; preserve
├── web/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # primary playground
│   │   ├── evaluation/
│   │   │   └── page.tsx           # measured report / honest empty state
│   │   ├── api/
│   │   │   ├── analyze/
│   │   │   │   └── route.ts       # real Jev, guarded POST only
│   │   │   └── demo-config/
│   │   │       └── route.ts       # optional safe feature flag; never returns secret
│   │   └── globals.css
│   ├── components/
│   │   ├── app-header.tsx
│   │   ├── issue-form.tsx
│   │   ├── sample-scenarios.tsx
│   │   ├── result-overview.tsx
│   │   ├── decision-card.tsx
│   │   ├── probability-bar.tsx
│   │   ├── policy-status.tsx
│   │   ├── proposed-labels.tsx
│   │   ├── evaluation-summary.tsx
│   │   └── feedback-state.tsx
│   ├── lib/
│   │   ├── contracts.ts         # UI-safe types / runtime guard
│   │   ├── preview-fixtures.ts  # clearly synthetic deterministic examples
│   │   ├── present-result.ts    # pure server-side public projection
│   │   ├── core-adapter.ts      # server-only, reuses root services
│   │   └── demo-guards.ts       # bounded input and opt-in mode guard
│   ├── tests/
│   │   ├── fixture-preview.test.ts
│   │   ├── presentation.test.ts
│   │   ├── issue-form.test.tsx
│   │   └── api-analyze.test.ts
│   ├── public/                  # optional tiny SVG assets
│   ├── .env.example             # placeholders; no secrets
│   ├── next.config.ts           # only necessary config
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── README.md
├── docs/
│   ├── architecture.md         # append UI boundary
│   ├── development.md          # append web commands
│   └── roadmap.md              # factual status
├── .github/workflows/ci.yml    # add web job if safe and verified
└── README.md                   # add web section, not full release rewrite
```

File naming can vary based on actual Next version and current source; avoid many microscopic abstraction files if they add no value. Never create empty fake modules only to match a tree. Preserve existing root scripts (`dev`, `start`, `triage`, `smoke:jev`, `triage:github`, `check`, etc.).

---

## 4. Product visual direction and scope

Build a focused, attractive **developer-tool interface** suitable for a short screen recording and GitHub README screenshots. It should look intentional, not like an unstyled student form or a full generic AI chatbot.

Visual inspiration (do not clone copyrighted assets): modern GitHub/Linear/Vercel developer tools. Use dark graphite/near-black with refined neutral surfaces, subtle borders and gentle glows; compact purposeful typography; a restrained violet/indigo accent for Jev, emerald for auto actions, amber for review and red for critical/security status. Color never conveys status alone: always include readable labels/icons. Tailwind CSS is enough—avoid decorative animation libraries; use subtle CSS transitions respecting reduced-motion settings.

### Header

- Product mark/icon and `JevFlow` name.
- Subtitle: **Confidence-Aware GitHub Issue Triage**.
- Small, honest status indicator for **Preview Fixture** / **Live Jev available** / **Live disabled**, derived from safe config—not fabricated operational health.
- Clear links/tabs: `Playground`, `Evaluation`, `GitHub` (only if actual known URL is configured; otherwise omit/disabled with honest explanation).
- One-sentence explanation that Jev produces typed decisions and the app's deterministic policy chooses actions.

### Primary playground layout

Desktop: two-column workbench, input at left and result at right. On mobile: stacked columns; never horizontal overflow or tiny unreadable text.

Left panel:
- Issue title (required; sensible max and remaining character count).
- Issue description (optional/empty permitted; bounded, preserve multiline text).
- Three labelled **synthetic** examples, e.g. authentication API bug, potential invoice data-access security issue and vague performance complaint. These are safe demo text, not real incident reports.
- Segmented control or clearly distinguishable modes: **Preview Fixture (offline)** and **Analyze with Jev (live, guarded)**. Disabled live mode must explain why and should not let user accidentally trigger a billable request.
- Button states: idle, loading, disabled, error, successful. One click → one deliberate analysis request; prevent duplicate submissions.
- Clear input validation, reset/try another, and optional copy-safe-summary action (must only copy projected result, not credentials or issue body).

Right panel:
- Helpful empty state before analysis.
- For preview fixture: prominent `SYNTHETIC PREVIEW — not a Jev result` badge.
- For live result: `LIVE JEV RESULT` badge only on actual successful provider response.
- Issue type, engineering area and priority as separate cards. For each, show the selected value, **selected option probability**, and separately reported **choice confidence** with meaningful labels and visually differentiated bars. Never replace one with the other.
- Binary `securitySensitive` and `needsHumanReview` cards must explicitly say **P(YES)**. Do not call them model certainty or verified security findings.
- Prominent policy mode banner: `AUTO`, `REVIEW SUGGESTED`, or `HUMAN REVIEW`, with readable reason descriptions derived from stable Task 03 codes and thresholds; show when classification labels are purposely withheld.
- Proposed GitHub labels as allowlisted chips, clearly labelled **Proposed locally / not applied to GitHub from this dashboard**.
- Model/latency metadata only if measured/returned; reveal input-truncation warnings and any honest unavailable metadata. Never show invented cost, measured accuracy, tokens or timing.
- A small architecture explainer: `Issue → Jev → Typed decisions → Policy → Proposed labels`.

### Evaluation view (`/evaluation`)

- Read Task 05's **actual persisted summary/report shape**; do not rewrite evaluation logic in the browser.
- If a valid measured report exists, show dataset size, actual source/mode, classification metrics with numerator/denominator, confidence-vs-coverage and latency *only when measured*. Distinguish fixture sanity checks from live Jev evaluation. Label dataset as synthetic/hand-labeled where applicable.
- If no report exists or it is not safe to display, render: `Evaluation report not generated yet`, plus the actual documented command to run it. No dummy percentage or fake bars.
- Keep underlying issue text or internal paths out of public output if inappropriate. Do not read arbitrary filesystem paths from the request.

**Scope constraint:** one compelling playground and one compact evaluation view, not a marketing multi-page website or admin suite.

---

## 5. Public response contract: sanitized typed projection, not raw SDK JSON

Define one small, stable web-facing response contract, derived from real Task 02/03 types. Use actual existing export names and normalize through **one server-side adapter**:

```ts
// Illustration only. Adapt exact fields to implemented application types.
interface PublicDecision<T extends string> {
  value: T;
  selectedProbability: number; // P(selected choice), 0..1
  reportedConfidence: number;  // separate SDK confidence, 0..1
}

interface PublicTriageView {
  source: 'live_jev' | 'synthetic_fixture';
  issueType: PublicDecision<string>;
  engineeringArea: PublicDecision<string>;
  priority: PublicDecision<string>;
  securitySensitiveProbabilityYes: number;
  needsHumanReviewProbabilityYes: number;
  policy: {
    mode: 'auto' | 'review-suggested' | 'human-review';
    reasonCodes: readonly string[];
    // optional safe thresholds / bounded evidence already provided by Task 03
  };
  proposedLabels: readonly string[];
  meta: {
    model?: string;             // only if actually reported by Jev
    latencyMs?: number;         // actual measured latency only
    inputTruncated: boolean;
    truncatedFields?: readonly string[];
  };
}
```

Do not serialize/return:

- `TYPESAFE_API_KEY`, `GITHUB_TOKEN`, auth headers, raw provider response/errors;
- issue event payloads, hidden system instructions, internal filesystem paths;
- arbitrary user-submitted content beyond what is needed for local display;
- unallowlisted label names or false claims about applied labels;
- fabricated cost, token usage, model names, accuracy or timing.

Use a typed runtime guard for the API response, or another small verified validation strategy. The UI must never crash because a server returned malformed JSON; show a safe error. The existing Task 02/03 normalizers remain authoritative; avoid deep-copying their validation rules. Use percent formatting for `[0,1]` and handle 0 and 1 correctly; add contextual labels for accessibility.

---

## 6. Server-only API, secrecy and live-mode control

Create a same-origin App Router **Node runtime POST** endpoint, e.g. `web/app/api/analyze/route.ts`, that does the following:

1. Guard it so **live Jev mode is disabled by default**, including when `TYPESAFE_API_KEY` happens to exist. Use a documented server-only opt-in such as `JEVFLOW_LIVE_DEMO_ENABLED=true` and an actual user-triggered submit action. The root `TYPESAFE_API_KEY` (if present) remains server-only; in `web/`, document secure ignored `.env.local` setup without copying or committing secrets.
2. For this MVP, keep live mode restricted to **local development** by default. Reject live requests in production unless a later separately-reviewed authentication, request limit and abuse-control design is implemented. An unauthenticated public endpoint spending API credits is prohibited. Do not automatically deploy an unprotected paid endpoint.
3. Require `POST`; `GET /api/analyze` should not infer. Validate `Content-Type: application/json`, body size, title/body types and limits and reject unexpected values safely. Reuse the existing Task 02 input validator/state builder; do not independently redefine stronger/weaker business input rules. Bound total incoming payload *before* JSON parsing as feasible.
4. Call the existing Task 02 analyzer **at most once per accepted user submission** at the application layer. No automatic frontend retry on failure. SDK internal retries are not a second application call; do not promise one underlying HTTP attempt.
5. Call the existing Task 03 pure policy and allowed proposed-label mapper. No Github auth, no Octokit, no label/comment mutation, no CI trigger.
6. Use server-only module boundary (`import 'server-only'` where appropriate) so secrets/provider code cannot be included in client bundles; keep any env flags returned to client minimal (e.g. `liveEnabled: boolean`, never secret or key length).
7. Use sanitized, concise status codes (`400/413/415/429/500/502/503` as appropriate) and safe error codes. Distinguish missing opt-in, missing server key, invalid request and provider failure without dumping issue text or raw SDK errors.
8. Consider a small in-memory local-development request throttle/concurrency guard only if it adds meaningful protection; be honest that it is not multi-instance production rate limiting. No persistent account/auth system.
9. The response has explicit `source: 'live_jev'` **only after a successful actual Jev response**. Never return fixture output as a fallback to provider failure while calling it live.
10. Disable caching of per-issue POST results and unnecessary request-body logging. Avoid telemetry/third-party analytics and leaking test issue text to console.

**No new production OpenAI API integration.** The coding agent is Codex; runtime decisions are Jev only. Never put `TYPESAFE_API_KEY` in `NEXT_PUBLIC_*`, static JSON or React client modules.

---

## 7. Honest no-key offline preview fixture path

Build a **deterministic, clearly marked preview mode** that works without Jev keys and does not call `/api/analyze` or any billable endpoint. Use three small synthetic issue scenarios (do not lift private issue bodies) with plausible fixture result objects strictly satisfying the public UI response contract. These values exist solely to exercise presentation, not demonstrate model accuracy.

Preview requirements:

- The mode is always clearly labelled `SYNTHETIC PREVIEW` prominently in the page **and result**.
- Selecting a sample fills the form; preview uses a matching static fixture only when the example is selected and unchanged. If the user edits the issue, do **not** pretend a preset fixture was computed for the new text. Show `Preview only supports unmodified sample scenarios` or another honest helpful state; real custom analysis requires opt-in live mode.
- No random synthetic scores or fake latency. For fixture presentation, metadata should say `Example values` or be omitted.
- Preview examples should cover an ordinary bug, a possible security escalation and an ambiguous human-review case. Do not label a hypothetical security result as a verified vulnerability.
- Demo data and UI test fixtures are small and clearly isolated, not recorded as Task 05's measured evaluation.
- Provide a useful page without API access and without publishing any real credential.

---

## 8. Accessibility, responsive behavior and polish

Deliver attractive **usable** UI, not decoration alone:

- Mobile (320–390px), tablet and desktop layouts; no overflow/truncated content in issue fields, probability labels or chips.
- Semantic `main`, `form`, headings, buttons and labels; keyboard interaction; visible focus rings; aria-live updates for analysis status and errors; explicit labels instead of placeholder-only fields.
- Use readable type and sufficient contrast; never depend solely on green/amber/red for status.
- Loading and disabled behavior prevents accidental repeat billable calls. Enter key in textarea should insert a newline; submit semantics should be predictable.
- Bound visible error messages, long labels and result text; sanitize user-entered text (normal React text rendering; no `dangerouslySetInnerHTML`). Do not turn user Markdown into raw HTML.
- `prefers-reduced-motion` supported; no required animation to understand results.
- Use a small icon package such as `lucide-react` only if installed/justified; do not import remote unlicensed imagery or external font files unnecessarily.
- An optional dark/neutral visual theme is enough; do not add theme preferences/persistence unless essentially free.
- Show connection/availability state truthfully. Missing key/opt-in must render a helpful disabled live mode, not a fake loading loop.

---

## 9. Web-level tests and integration requirements

Add meaningful **offline** tests to the web app using supported Next/Vitest guidance and React Testing Library as appropriate. Use dependency injection or module mocks for the route/core adapter. Never invoke the actual Jev SDK/provider during tests.

Required test cases:

### Data and presentation

1. `choice` selected probability and reported confidence remain distinct in UI/presentation; tests include unequal values.
2. `securitySensitive` and `needsHumanReview` rendered as P(YES), never as generic confidence or confirmed findings.
3. Exactly the proposed labels are rendered; human-review mode withholds speculative categories in accordance with Task 03.
4. 0, 1 and intermediate probabilities format correctly; invalid projection rejects with sanitized failure.
5. Latency/model/usage shown only if real metadata exists; fixture preview cannot accidentally claim measured values.
6. Truncated input displays warning and reason codes map to readable text without dynamic HTML.
7. Missing Task 05 report yields honest empty state, not fabricated metrics.

### UI state

8. Initial form is empty/ready; sample selection fills expected text.
9. Editing a sample invalidates preview matching; no fake result for arbitrary custom input.
10. Invalid title/body cannot submit; repeated click while loading does not launch duplicate analysis.
11. Successful live response, missing-key/disabled state, network error, server error and malformed JSON have clear UI states.
12. Keyboard navigation, inputs' labels and error semantics are testable.

### API and boundaries

13. Endpoint rejects non-POST, wrong content type, oversized/malformed JSON, missing title and unsupported types before provider call.
14. Live endpoint disabled by default and in production; it makes zero provider calls in those states.
15. Explicit development opt-in + injected provider calls existing analyzer once, then real policy + labels; no GitHub write.
16. Provider failure is returned as sanitized error, not disguised as synthetic fixture result.
17. Response never exposes secret/env values, raw issue payload or raw provider errors.
18. Root Task 01–05 unit/evaluation/CI commands still pass, and `web` build succeeds independently.

If async Next Server Components cannot be practically unit-tested with current Vitest support, keep a tiny server-only data loader independently testable and use a smoke/E2E check for the actual page. Do not weaken validation or report a skipped test as passed. Avoid snapshot-only tests with no behavior assertions.

---

## 10. npm scripts, independent builds and CI

Provide clear commands in `web/package.json`, compatible with installed tooling:

```text
npm --prefix web run dev
npm --prefix web run build
npm --prefix web run start
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web run test
npm --prefix web run check
```

`check` should run web lint, typecheck, tests and build (and format check if configured). Install with `npm --prefix web install`; verify reproducibility with `npm --prefix web ci`. If workspace layout differs for a documented technical reason, provide exact equivalent commands and verify them.

Preserve root `npm run check`, `npm run triage`, `npm run triage:github`, `npm run smoke:jev` and any Task 05 report scripts. Optional root convenience aliases may call web scripts but must not cause live inference. Avoid root source TS compiler sweeping `web/.next` into emitted `dist/`; configure correct test/build include/exclude scopes. Ensure `.env.local` and other real secrets are ignored at both root and web levels.

Add a separate `web` job to `.github/workflows/ci.yml` **if safe and compatible**. It should run `npm ci` in the correct package, then `npm run check`, no secret required, with minimum `contents: read`. Do not let build prerender invoke provider, parse `.env` requiring a key or load any live evaluation automatically. Do not change Task 04's issue-trigger workflow semantics.

---

## 11. Documentation that must be updated in Task 06

Update succinctly and factually:

- `web/README.md`: installation, `npm --prefix web ...` commands, offline preview, server-only optional live configuration, local-only limitations, provider cost awareness, UI limitations, security and no GitHub mutations.
- `web/.env.example`: only explanatory placeholders. Example: `JEVFLOW_LIVE_DEMO_ENABLED=false`, `TYPESAFE_API_KEY=`. Never use a `NEXT_PUBLIC_` credential. If the root env is not automatically inherited by Next, document how to add an ignored `web/.env.local` without copying secrets into Git.
- Root `README.md`: short new playground section and honest implemented features, with link to `web/README.md`; preserve Task 01–05 docs.
- `docs/architecture.md`: server/client trust boundary and no GitHub writes from UI.
- `docs/development.md`: two-package independent workflow, web checks, local preview/live instructions.
- `docs/decisions.md`: why live off by default, why synthetic preview distinct from measured reports, and which code-sharing strategy builds successfully.
- `docs/roadmap.md`: Task 06 only marked complete after verified work and safe merge.
- Root `AGENTS.md` and prompt files: preserve. Only minimal justified compatibility change, no wholesale rewrite.

Do not add fake demo screenshots or claim deployed URLs. Actual screenshots/demo/video production belongs in Task 07.

---

## 12. Mandatory implementation order for Codex

1. Read `AGENTS.md`, this full prompt, real source exports/reports and repo state; confirm correct repository and baseline.
2. Create/reuse `feat/demo-dashboard` safely from `main`; run the existing root check.
3. Choose and document the least-complex, buildable Next App Router/shared-core integration strategy. Install compatible web dependencies and commit its lockfile.
4. Define one validated UI-safe public result contract and pure projection from existing Task 02–03 data. Add tests for probability semantics and privacy.
5. Implement the guarded Node Route Handler, server-only core adapter, safe opt-in and request validation. Add mocked route tests.
6. Add three synthetic sample scenarios and deterministic preview behavior; prove they never contact the API.
7. Build the responsive, visually polished main playground and result/status components. Test states and accessibility.
8. Implement evaluation page reading **actual** Task 05 report if available and an honest empty state otherwise. No guessed metrics.
9. Add web scripts/config and, only when safe, its independent CI job. Preserve existing root scripts and issue workflows.
10. Update docs and roadmap; run formatting with intentional scope, not rewriting long prompt files unnecessarily.
11. Run all tests and independent builds; resolve errors instead of suppressing them. Test live-disabled behavior *without* a key. **Do not run live Jev inference unless the user separately authorizes it.**
12. Inspect `git diff`, secret tracking, staged files, and output artifacts. Commit verified feature branch; safely merge to `main` only if all checks pass; rerun root and web checks on `main`.
13. Provide a factual report including browser availability/testing status, Git details and blockers. **Stop before Task 07.**

---

## 13. Exact verification checklist / commands

Use real available scripts; report each observed outcome rather than guessing. In PowerShell adapt shell syntax. `npm run dev` for Next is long-running—run a controlled local smoke/browser test and terminate it safely.

```bash
# Existing core
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
npm run triage -- --help

# Independent web app
npm --prefix web ci
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web run test
npm --prefix web run build
npm --prefix web run check

# Source checks
git diff --check
git diff --stat
git status --short
```

Manual browser smoke (use a browser if available, otherwise state NOT RUN with reason):

- Landing/playground loads on local dev URL.
- All three synthetic samples preview offline and are clearly marked synthetic.
- Custom issue does not reuse a fixture result.
- Missing key / live opt-in disabled is explained clearly.
- API rejects malformed/missing request with no inference.
- Layout works in narrow mobile width and desktop width.
- Evaluation page shows only actual Task 05 results or honest missing-report state.
- Browser network/devtools shows no TypeSafe API key in any client resource, request body, response or bundle.

**Optional actual Jev live smoke**: permitted only if the user expressly authorizes a paid request, the ignored server-side key is configured, local-development live mode is explicitly enabled and a benign synthetic issue is used. Test one request without logging secrets; report exact observed result and whether it succeeded. Never make real requests as a side effect of `build`, `test`, `check`, page load or preview. If not authorized, report `NOT RUN — explicit live approval absent`.

Suggested commit message:

```text
feat: add JevFlow offline playground and guarded live dashboard
```

After passing checks, merge only if safe:

```bash
git switch main
git merge --no-ff feat/demo-dashboard
npm run check
npm --prefix web run check
git status --short
```

Never invent a commit hash, test count, browser result, remote deployment, measured metrics or successful merge.

---

## 14. Acceptance criteria (all mandatory for offline completion)

- [ ] Main JevFlow source repository selected; separate test repo untouched.
- [ ] Prior Tasks 01–05 preserved and existing `npm run check` passes.
- [ ] Next.js App Router `web/` works with verified source-core sharing; no duplicate Jev classifier/policy.
- [ ] Three deterministic synthetic preview scenarios work with no key, provider call or invented measurement claim.
- [ ] Only explicitly enabled user-triggered server route invokes existing Jev analyzer; no live mode by default or on public unauthenticated production.
- [ ] Secrets and server-only code never leak into browser bundle; no `NEXT_PUBLIC_` credentials.
- [ ] UI correctly differentiates selected probability, reported confidence and binary P(YES).
- [ ] Actual policy mode/reasons and only approved **proposed** labels are rendered; dashboard never mutates GitHub.
- [ ] Good loading, empty, failure, success, responsive and keyboard states exist; preview/live provenance always visible.
- [ ] Task 05 measured report only displayed when genuinely present; empty state otherwise.
- [ ] Web route/presentation/components have meaningful offline tests; malformed/disabled route tests prove no inference.
- [ ] Independent root and web install/test/build/check succeed or exact blockers recorded.
- [ ] Documentation and roadmap match actual implementation; secrets/lockfiles/Git diff verified.
- [ ] Feature branch safely committed/merged, or exact honest blocker reported.
- [ ] Task 07 release work was not implemented prematurely.

---

## 15. Final factual Codex report (required)

```text
JevFlow — Task 06 Implementation Report

Workspace / prior tasks: ...
Branch: feat/demo-dashboard
Core sharing strategy: ... (why; exact verified build)

Delivered:
- Next.js web app and routes
- Preview fixture experience
- Live opt-in / protected server handler
- Shared core adapter and public view schema
- Decision cards, policy/reason/label visualization
- Evaluation page and missing-report behavior
- UI/component/route tests
- Docs/CI changes

Observed checks:
- Root format/typecheck/lint/tests/build/check: ... (counts)
- Web npm ci/typecheck/lint/test/build/check: ... (counts)
- Browser smoke/mobile/desktop: PASS / FAIL / NOT RUN (evidence/reason)
- Live Jev call: PASS / FAIL / NOT RUN (why; never assume)
- Secret/client-boundary inspection: ...
- git diff --check: ...

Files changed: ...
Commit: <actual hash or reason unavailable>
Merge into main: YES / NO with factual reason
Current Git status: ...
Remote push / deployment: NOT PERFORMED unless explicitly authorized and confirmed
Known limitations: local-only live gating; no browser GitHub mutations; evaluation report availability; any other true constraint

Next: Task 07 — Documentation, Final QA & Release (Codex Edition).
```

**EXECUTE TASK 06 ONLY AND STOP.**
