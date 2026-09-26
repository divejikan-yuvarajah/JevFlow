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

Task 01 defines only the application vocabulary, issue input, environment configuration, and an offline bootstrap. The actual TypeSafe AI Jev SDK contract has not been inspected or modeled yet.

## Module boundaries

- `src/domain/` owns canonical application types and vocabulary. Future modules consume these definitions instead of duplicating strings.
- `src/config/` validates environment configuration and keeps secrets optional and server-side.
- `src/cli/` provides the current offline bootstrap and will remain an entry point as later capabilities arrive.
- `src/jev/` will adapt the real SDK to the application domain in Task 02.
- `src/triage/` will normalize typed inference results in Task 02.
- `src/policy/` will apply deterministic confidence and escalation rules in Task 03.
- `src/github/` will contain GitHub parsing and side effects in Task 04.

GitHub API calls must not enter the Jev adapter, policy must remain independent of presentation code, and untrusted issue text must be bounded before it is sent to an inference provider.
