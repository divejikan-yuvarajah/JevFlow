# Architecture

JevFlow will turn untrusted GitHub issue text into typed triage recommendations while keeping inference, deterministic policy, and external side effects separate.

## Planned data flow

```text
GitHub issue event (Task 04)
  → typed input and bounded Jev state (Task 02)
  → TypeSafe AI Jev structured decisions (Task 02)
  → normalized domain results (Task 02)
  → deterministic confidence policy (Task 03)
  → canonical proposed labels (Task 03)
  → GitHub mutations and action summary (Task 04)
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

The policy uses the minimum of selected probability and reported confidence for each choice, then the weakest of the three choice scores. Critical priority, security P(YES), human-review P(YES), and truncated input can only raise the review mode. The label mapper performs no GitHub operation. Task 04 will reconcile proposed labels with real issues.

## Module boundaries

- `src/domain/` owns canonical application types and vocabulary. Future modules consume these definitions instead of duplicating strings.
- `src/config/` validates environment configuration and keeps secrets optional and server-side.
- `src/cli/` provides the current offline bootstrap and will remain an entry point as later capabilities arrive.
- `src/jev/` owns bounded state, trusted question definitions, and the lazy official SDK adapter.
- `src/triage/` orchestrates analysis and exposes the validated provider-independent result.
- `src/policy/` applies deterministic confidence and escalation rules without side effects.
- `src/github/labels.ts` contains only the canonical label allowlist and pure proposal mapping.
- Future Task 04 GitHub modules will own event parsing and API side effects.

GitHub API calls must not enter the Jev adapter, policy must remain independent of presentation code, and untrusted issue text must be bounded before it is sent to an inference provider.
