# JevFlow target repository installation

> **CONFIGURE BEFORE INSTALL.** This template is intentionally inactive until its source owner and immutable commit SHA placeholders are replaced.

The workflow in this directory runs inside the separate `jevflow-test-repo`. Its `GITHUB_TOKEN`, event payload, issue identity, and write permission all belong to that target repository. A workflow stored only in the JevFlow source repository cannot listen to issues opened elsewhere.

## Public source installation

1. Review and approve the exact JevFlow source commit to deploy.
2. Confirm the JevFlow source repository is public.
3. Copy `jevflow-triage.yml` to `.github/workflows/jevflow-triage.yml` on the target repository's default branch.
4. Replace `REPLACE_OWNER/jevflow` with the approved public source repository.
5. Replace `REPLACE_WITH_FULL_40_CHARACTER_COMMIT_SHA` with the reviewed immutable 40-character commit SHA. Do not use a branch or floating tag.
6. Keep both official actions pinned to their reviewed immutable SHAs and verify them before deployment.
7. Add `TYPESAFE_API_KEY` as a target repository Actions secret. Never put its value in YAML, source, issues, logs, or chat.
8. In target repository Actions settings, allow workflows to use read and write permissions when organization or repository policy otherwise restricts `GITHUB_TOKEN`. The workflow itself requests only `contents: read` and `issues: write`.
9. Confirm the workflow is present on the target repository's default branch; issue triggers do not use workflow files that exist only on another branch.

The target repository's default token can read a public source repository. It does not necessarily have permission to read a private JevFlow repository. For private source, publish a reviewed versioned package/build or provide a separately approved narrow read-only source credential. Do not create or reuse a broad personal access token for convenience.

## Label preparation

No separate seed command is required. During an authorized run, JevFlow creates missing allowlisted labels before applying them. It never overwrites the whole issue label list, preserves unrelated labels, and treats `security-review` as sticky. Review the canonical catalog in `src/github/labels.ts` at the pinned source commit before installing the workflow.

## Explicit live validation checklist

1. Create one benign synthetic issue and inspect the single workflow run, labels, and Actions summary.
2. Confirm selected probability, reported confidence, and P(YES) are shown as different metrics.
3. Open a synthetic security-sensitive scenario and an ambiguous issue. Model predictions can vary and do not prove a vulnerability.
4. Run `workflow_dispatch` with an existing positive issue number and confirm label reconciliation is idempotent.
5. Test the provider-failure human-review fallback only in an isolated authorized run, then restore the secret or configuration afterward.
6. Add further synthetic issues one at a time only when additional paid Jev requests are explicitly authorized. Treat expected labels as a human review aid; probabilistic model output can differ between runs.

No workflow, label seed, issue seed, secret creation, live inference, or remote push is performed by this template itself.
