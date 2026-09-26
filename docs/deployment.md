# Deployment and Live Verification Guide

No deployment is performed by this guide. Every live Jev request can incur cost and every issue workflow can modify labels. Review the pinned source commit, repository permissions, and synthetic test text before enabling either path.

## A. Run JevFlow on its own repository

1. Push a reviewed commit containing `.github/workflows/jevflow-triage.yml` to the intended default branch.
2. In **Settings → Secrets and variables → Actions**, create the repository secret `TYPESAFE_API_KEY`.
3. In **Settings → Actions → General**, confirm organization/repository policy permits the requested token permissions. The workflow itself requests only `contents: read` and `issues: write`.
4. Confirm Actions are enabled and the workflow appears on the Actions tab.
5. Create one benign synthetic issue. Do not include credentials, private customer data, or a real vulnerability report.
6. Inspect the run summary, normalized probability labels, proposed/applied labels, and any partial-operation message.
7. From **Actions → JevFlow issue triage → Run workflow**, enter that existing issue's positive integer number to test idempotence.
8. Confirm unrelated human labels remain and no second run writes when the desired label state already exists.

The automatic `GITHUB_TOKEN` belongs to this repository. Do not create a personal token for the normal source-repository workflow.

## B. Run on disposable `jevflow-test-repo`

1. Create or open the separate disposable repository. Keep it independent from JevFlow source.
2. Select and review a JevFlow commit. The source must be public for the prepared checkout strategy.
3. Copy `deploy/target-repo/jevflow-triage.yml` to `.github/workflows/jevflow-triage.yml` on the target's default branch.
4. Replace `REPLACE_OWNER/jevflow` with the actual public source and replace `REPLACE_WITH_FULL_40_CHARACTER_COMMIT_SHA` with the reviewed immutable source SHA. Do not use `main` or a floating tag.
5. Review the official action SHAs and the source lockfile at that commit.
6. Add `TYPESAFE_API_KEY` as an Actions secret in **the target repository**. The target's automatic `GITHUB_TOKEN` performs target label operations; source tokens and secrets do not transfer.
7. Open one benign synthetic issue first. JevFlow creates missing allowlisted labels during the authorized run, so no separate seed script is required.
8. Inspect one ordinary bug, one fictional security-sensitive scenario, and one deliberately ambiguous scenario one at a time. Treat any expected label list as a hand-authored review aid, not a deterministic model oracle.
9. Manually re-run one existing issue number and verify idempotence, sticky `security-review`, human-label preservation, and honest failure reporting.
10. Record real issue and workflow-run URLs only after they exist.

An optional GitHub CLI dispatch, run only after authentication and approval, is:

```bash
gh workflow run jevflow-triage.yml -f issue_number=<existing-positive-number>
```

Do not script bulk issue creation. Start with one call and confirm billing, permissions, and behavior.

## Public versus private source

The target template checks out public source without a separate source credential. A target repository's automatic token must not be assumed to read a private JevFlow repository. For private source, design and approve a narrow read-only mechanism or publish a reviewed versioned artifact. Do not silently add a broad personal access token.

## Failure and restoration

- A provider/normalization/policy failure for a trusted issue should add `jev:human-review` without invented category labels.
- A GitHub API partial failure should leave a nonzero workflow result and list actual completed/failed operations in the summary.
- `security-review` stays until a human removes it.
- To stop future runs, disable or remove the workflow from the target default branch.
- If a test key is rejected or exposed, revoke and rotate it at TypeSafe AI, replace the target secret, and remove local copies. Never print it while troubleshooting.

## Verification status for v0.1.0 preparation

| Check                              | Status   |
| ---------------------------------- | -------- |
| Workflow template reviewed locally | PASS     |
| Installed on target default branch | NOT DONE |
| Live Jev inference                 | NOT RUN  |
| Actual GitHub issue labeling       | NOT RUN  |
| Public web deployment              | NOT DONE |

Local static review is not evidence of a GitHub-hosted run.
