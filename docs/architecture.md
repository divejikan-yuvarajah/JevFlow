# Architecture

JevFlow will turn untrusted GitHub issue text into typed triage recommendations while keeping inference, deterministic policy, and external side effects separate.

## Automation data flow

```text
bounded, repository-verified GitHub issue event
  → typed input and bounded Jev state (Task 02)
  → TypeSafe AI Jev structured decisions (Task 02)
  → normalized domain results (Task 02)
  → deterministic confidence policy (Task 03)
  → canonical proposed labels (Task 03)
  → exact allowlisted label reconciliation
  → narrow GitHub API adapter
  → sanitized Actions job summary
```

Task 02 uses the official `@typesafe-ai/sdk` contract. `buildJevState` validates and bounds untrusted input, `JEV_QUESTIONS` defines five trusted questions, the lazy provider performs one application-level `systemOne` call, and `normalizeJevResult` validates the external response before returning `TriageResult`.

The SDK may retry an eligible failed HTTP attempt according to its bounded retry configuration. JevFlow makes one application-level `systemOne` invocation; that does not promise one physical HTTP attempt.

## Task 02 flow

```text
IssueInput
  → runtime validation and code-point truncation
  → bounded Jev state plus truncation metadata
  → three choice questions and two NOUL questions
  → lazy server-side TypeSafeClient.systemOne
  → strict runtime response validation
  → provider-independent TriageResult
```

For choices, the selected option probability and SDK-reported confidence remain separate. For NOUL questions, `noul` is P(YES) from zero through one. The analyzer does not turn either metric into an automation decision.

## Task 03 flow

```text
analyzeIssue TriageResult
  → pure confidence and safety policy
  → explainable TriagePlan
  → static allowlisted label proposal
  → human-readable or JSON local CLI output
```

The policy uses the minimum of selected probability and reported confidence for each choice, then the weakest of the three choice scores. Critical priority, security P(YES), human-review P(YES), and truncated input can only raise the review mode. The label mapper performs no GitHub operation. The GitHub layer validates its output against the static catalog before planning any mutation.

## Task 04 flow

```text
GITHUB_EVENT_PATH
  → bounded JSON read and trusted repository/issue identity
  → current issue API fetch for manual dispatch
  → analyzeIssue once at the application level
  → existing confidence policy and proposed-label mapper
  → current issue labels and pure exact-name reconciliation
  → ensure/add approved labels before removing stale managed labels
  → sanitized GitHub Actions summary based on actual operations
```

Unsupported events are skipped before credentials or inference are used. Automatic opened events use their validated issue payload; manual dispatches fetch the current issue and reject pull-request-shaped responses. If inference, normalization, or policy fails after identity is trusted, a separate fallback adds `jev:human-review`, clears only stale automatic/review mode markers, and preserves existing category, community, human, and security labels. It never creates a synthetic `TriageResult`.

The GitHub API boundary exposes only get issue, list labels, ensure a catalog label, add approved labels, and remove one approved label. It never replaces the complete label set. `security-review` is sticky and requires human removal. Operation reports record actual successes and failures so partial work cannot appear successful.

## Task 05 evaluation flow

```text
validated 30-case synthetic dataset
  → offline authored fixture analyzer (default) or explicitly confirmed live analyzeIssue
  → existing normalized TriageResult contract
  → existing confidence policy and proposed-label mapper
  → sanitized per-case records
  → pure metrics with explicit denominators
  → JSON or Markdown report
```

Evaluation is sequential and dependency-injected. A case failure is recorded and later cases continue. Fixture mode never constructs the Jev provider and excludes synthetic latency metadata from provider latency. Live mode calls the existing analyzer and never falls back to fixtures. Neither mode constructs Octokit or applies GitHub mutations; proposed labels remain policy output.

## Task 06 presentation flow

```text
Next.js client component
  → offline sample match and synthetic fixture projection (no request)
  OR deliberate same-origin POST /api/analyze
  → development-only server opt-in and bounded request validation
  → existing analyzeIssue once
  → existing confidence policy and proposed-label mapper
  → allowlisted PublicTriageView
  → decision, probability, policy, and proposed-label presentation
```

The `web/` package consumes the root package's compiled `dist/` contract through narrow adapters; its scripts build that core first from the authoritative `src/` tree. This avoids copying logic and preserves the root NodeNext ESM resolution in Next's bundler. `present-result.ts` is pure and calls the existing policy and label mapper. `core-adapter.ts` is marked server-only and is the only dashboard module that imports `analyzeIssue`; client components cannot import provider or credential handling. The API response omits issue text, provider errors, credentials, raw SDK responses, and internal paths.

Live dashboard inference is disabled by default, restricted to local development, and requires both `JEVFLOW_LIVE_DEMO_ENABLED=true` and a server-side `TYPESAFE_API_KEY`. Preview submission never calls the route. The dashboard does not import Octokit, update issues, trigger workflows, or apply labels. Its evaluation page scans only the fixed local `evals/results/` directory, validates a narrow Task 05 summary, and never renders report cases or paths.

## Module boundaries

- `src/domain/` owns canonical application types and vocabulary. Future modules consume these definitions instead of duplicating strings.
- `src/config/` validates environment configuration and keeps secrets optional and server-side.
- `src/cli/` provides the offline bootstrap, local file CLI, and guarded GitHub Actions entry point.
- `src/jev/` owns bounded state, trusted question definitions, and the lazy official SDK adapter.
- `src/triage/` orchestrates analysis and exposes the validated provider-independent result.
- `src/policy/` applies deterministic confidence and escalation rules without side effects.
- `src/github/labels.ts` owns the canonical label allowlist, definitions, and pure proposal mapping.
- The remaining `src/github/` modules own event parsing, the injected Octokit adapter, reconciliation, orchestration, operation reports, and summary rendering.
- `src/evaluation/` owns dataset and fixture validation, fixture adaptation, sequential evaluation, pure metrics, and sanitized report rendering. Versioned content and annotation guidance live under `evals/`.
- `web/` owns the optional Next.js presentation adapter, public response contract, synthetic preview experience, guarded local route, responsive UI, and read-only evaluation summary.

GitHub API calls must not enter the Jev adapter, policy must remain independent of presentation code, and untrusted issue text must be bounded before it is sent to an inference provider.
