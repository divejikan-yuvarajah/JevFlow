# Security and Privacy

## Scope

This document is a practical MVP review of the JevFlow source, workflows, and local dashboard. It is not an independent audit, penetration test, compliance assessment, or guarantee that JevFlow detects vulnerabilities.

## Assets and trust boundaries

| Asset                     | Main risk                                             | Current control                                                                              |
| ------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `TYPESAFE_API_KEY`        | Browser, log, source, or workflow disclosure          | Ignored environment files, server-only imports, no `NEXT_PUBLIC_` variable, SDK logging off  |
| Repository `GITHUB_TOKEN` | Cross-repository or excessive mutation                | Automatic repository-scoped token and explicit `contents: read`, `issues: write` permissions |
| Issue title and body      | Injection, oversized input, sensitive-data disclosure | Runtime validation, code-point limits, no shell interpolation, no summary echo               |
| Jev response              | Malformed or invented probability data                | Strict runtime normalization; missing or invalid values fail closed                          |
| Proposed labels           | Arbitrary model-controlled mutation                   | Exact static catalog and definition validation                                               |
| Evaluation artifacts      | Private text or false performance claims              | Synthetic IDs and safe fields only; generated artifacts ignored; provenance required         |

## Implemented controls

### Input and inference

- `buildJevState` requires a nonempty title, validates metadata, and truncates title/body to 300/8,000 Unicode code points.
- GitHub event JSON is capped at 1 MiB and must match `GITHUB_REPOSITORY`; manual issue numbers must be positive safe integers.
- Three choice results must include every canonical probability, a valid selected value, and a separate reported confidence. Binary results are validated as P(YES).
- The TypeSafe client is created lazily for a live request, has a 10-second timeout, bounded retries, and logging set to `off`.
- Provider and GitHub errors are converted to stable codes and do not expose raw response bodies, authentication headers, issue text, or credential values.

### GitHub automation

- Workflows trigger only for `issues: opened` and validated `workflow_dispatch`; there is no `pull_request_target`, comment, edited, or labeled trigger.
- Official checkout and setup-node actions are pinned to reviewed immutable commits.
- Issue content and model output are never used as commands, refs, secret names, paths, action names, or concurrency identifiers.
- Reconciliation adds exact desired labels before removing stale JevFlow-managed labels. It preserves unrelated labels and similar prefixes.
- `security-review` is sticky. It requests manual review and does not claim that a vulnerability is confirmed.
- Provider or policy failure on a trusted target uses `jev:human-review` without inventing a classification. Partial API work is reported as partial or failed.

### Dashboard

- Client components do not import the TypeSafe SDK, analyzer, configuration loader, GitHub client, or environment secrets.
- The API route is server-only, disabled by default, disabled under `NODE_ENV=production`, and requires a second explicit opt-in flag in local development.
- The route accepts only JSON with `title` and optional `body`, caps encoded input at 48 KiB, validates it through the core state builder, and returns `Cache-Control: no-store`.
- API results omit issue text, credentials, raw provider responses, internal paths, and raw errors. The dashboard never mutates GitHub.
- A future public live endpoint needs authentication, authorization, rate limiting, cost controls, abuse monitoring, and privacy review before production enablement.

## Secret handling

- `.env`, `.env.*`, `web/.env*`, logs, build output, generated reports, and dependency directories are ignored with explicit exceptions for placeholder examples.
- `.env.example` and `web/.env.example` contain empty placeholders only.
- GitHub secrets must be set in the repository receiving the issue event. Source repository secrets do not transfer to `jevflow-test-repo`.
- If a key appears in Git history, logs, screenshots, issues, or chat, revoke and rotate it at the provider, remove it from current files, and follow the hosting provider's history-remediation process. Deleting only the local file is insufficient.

## Privacy guidance

A live request sends the bounded issue title and body to TypeSafe AI Jev. Before using real repository issues, review the provider's data handling, retention, region, access, and billing terms. Avoid secrets, personal data, embargoed vulnerabilities, and private customer reports unless the repository owner has approved that processing.

The committed 30-case evaluation dataset and dashboard previews are fictional. Generated evaluation reports omit raw issue text and sanitized provider failures contain codes only.

## Dependency and supply-chain review

Both npm packages use committed lockfiles. CI installs with `npm ci`; GitHub workflows pin third-party actions by full commit SHA. `npm audit` results are recorded in the release report because advisory results can change over time. Do not run `npm audit fix --force` as a release shortcut.

## Known limitations

- Probabilistic triage can be wrong and must not be treated as a security decision or service-level commitment.
- The synthetic evaluation does not establish accuracy, calibration, provider latency, safety, or cost.
- Local static and injected-adapter tests do not prove GitHub-hosted behavior, organization policy compatibility, or target-repository installation.
- The dashboard's local-development gate is intentionally unsuitable as public access control.
- Security-sensitive issues may still be processed by the inference provider if a live workflow is enabled; maintainers need a disclosure and privacy policy appropriate to their repository.

## Reporting a security concern

Until a private reporting channel is selected, do not post secrets or exploit details in a public issue. The repository owner should configure GitHub private vulnerability reporting or publish a dedicated security contact before public release.
