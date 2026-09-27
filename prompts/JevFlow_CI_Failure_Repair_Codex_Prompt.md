# JevFlow — GitHub Actions CI Failure Investigation & Repair (Codex Edition)

> **Execute this debugging task only.** Work in the existing `divejikan-yuvarajah/JevFlow` source repository using the VS Code OpenAI Codex extension. Do not implement new product features.  
> Source: https://github.com/divejikan-yuvarajah/JevFlow  
> CI: https://github.com/divejikan-yuvarajah/JevFlow/actions/workflows/ci.yml  
> Target branch: `fix/ci-workflows` (unless an existing safe repair branch already exists).  
> OpenAI Codex is the development assistant; TypeSafe AI Jev is the application inference provider.

## 0. Mission and definition of success

A screenshot shows multiple GitHub Actions CI runs failing on PRs and merges to `main` (including release QA and light-theme changes). **Do not infer the cause from red icons alone.** Obtain the actual failure logs, identify the *earliest actionable failing step* in each job, reproduce failures locally under GitHub-like conditions, make the smallest appropriate fixes, and verify on a new PR/commit that **both CI jobs pass on GitHub**. Separate locally verified success from observed remote success. Historic red runs will remain failed; do not claim they change retroactively.

The publicly visible repository's `.github/workflows/ci.yml` currently has two jobs:

- `check`: checkout → setup Node 20 with npm cache → root `npm ci` → root `npm run check`.
- `web`: checkout → setup Node 20 with root+web lockfile cache → root `npm ci` → `npm --prefix web ci` → `npm --prefix web run check`.

The root `package.json` declares `node >=20.19.0`, and `web/` is a separate Next.js package with its own lockfile and `check` script. Inspect the real checkout instead of assuming it exactly matches this snapshot. The root and web also have separate Prettier versions/ignore configurations; check whether scopes overlap before changing any formatting rule. These are **diagnostic leads, not proven failure causes**.

## 1. Mandatory inspection before editing

Read:

```text
AGENTS.md
.github/workflows/ci.yml
.github/workflows/jevflow-triage.yml
package.json
package-lock.json
.prettierignore
.prettierrc* (if present)
eslint.config.*
tsconfig.json
tsconfig.build.json
web/package.json
web/package-lock.json
web/.prettierignore
web/Prettier/ESLint/TypeScript/Next.js configs (actual names)
docs/roadmap.md
any existing final QA/test report
```

Run shell equivalents appropriate for the actual OS (PowerShell is fine):

```bash
git status --short
git branch --show-current
git branch -a
git remote -v
git log --oneline -8
node --version
npm --version
npm run
gh --version
gh auth status
```

Stop on a wrong workspace (`jevflow-test-repo`), missing Task 01–07 core, or unsafe dirty branch state. Preserve all user changes. Never use `git reset --hard`, `git clean -fd`, force push, silent stash, or copy real secret values into logs or chat.

## 2. Retrieve the ACTUAL failed GitHub Actions logs first

Use the authenticated GitHub CLI in the user's current VS Code terminal, if installed and authorized. This is a read-only diagnostic step. The repository is `divejikan-yuvarajah/JevFlow`.

```bash
gh run list --repo divejikan-yuvarajah/JevFlow --workflow ci.yml --limit 20 --json databaseId,headSha,headBranch,event,status,conclusion,url
```

Select the latest failed `main` push run and latest failed PR run (prefer different source commits when useful). For each real ID:

```bash
gh run view RUN_ID --repo divejikan-yuvarajah/JevFlow
gh run view RUN_ID --repo divejikan-yuvarajah/JevFlow --log-failed
```

If logs are incomplete, use the GitHub UI: Actions → CI → failed run → failed job → expand the **first red step** → inspect the complete log and annotations. If permitted, download run logs with the official UI or GitHub CLI. Do not dump tokens, raw `.env`, or untrusted issue bodies into reports.

Create a short diagnosis table:

| Run ID / commit | Job | First failing step | Exact concise error excerpt | Root cause / evidence |
|---|---|---|---|---|

If the CLI is unauthenticated or logs are unavailable, **do not fabricate evidence**. Say `REMOTE LOGS NOT ACCESSIBLE`, give the user exact steps to share the failing log, and still reproduce local CI safely. Avoid blindly editing workflows based only on the screenshot.

Distinguish setup/action failures from install failures, format, typecheck, lint, tests and build. Check whether both jobs share the same failure or have separate causes. Inspect first failing historical run, not only the most recent, if necessary to locate when the problem started.

## 3. Reproduce the same GitHub CI sequence locally

Use compatible Node 20 with version **at least 20.19.0**; report exact patch version. GitHub YAML currently requests `node-version: 20`: verify the runner's resolved version in its logs. On Windows, use the equivalent commands; consider a clean disposable **worktree** or Windows/WSL environment only when safe and useful. Do not delete user files.

Root job:

```bash
npm ci
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check
```

Web job (install shared core first, exactly as CI does):

```bash
npm ci
npm --prefix web ci
npm --prefix web run format:check
npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
npm --prefix web run check
```

Record **PASS / FAIL / BLOCKED** for each step with a concise diagnostic. Do not claim a green `npm run check` merely because local `npm run dev` works. Prefer `npm ci` over `npm install` for lockfile reproducibility. Do not run live `smoke:jev`, live eval, GitHub issue triage, issue seeding, or any paid network inference to diagnose CI.

## 4. Investigate likely failure categories, but only fix what evidence supports

1. **Lockfile/install:** Verify that root and `web/package-lock.json` match their respective package manifests and `npm ci` succeeds on Linux. Update lockfiles through normal npm tooling only if proven stale; never hand-edit lockfile internals.
2. **Node compatibility:** Check root `engines.node >=20.19.0`, Next.js/tooling requirements and actual hosted runner patch. If patch pinning is needed, use a valid reviewed setting or `.nvmrc` and verify cache configuration. Don't assume a random older Node version will fix it.
3. **Action pins/runtime:** Inspect validity and provenance of checkout/setup-node SHA pins, action runtime requirements, and first failed step. The currently visible pins are full SHAs annotated as `checkout v7.0.1` and `setup-node v7.0.0`; do not downgrade/replace blindly merely because versions look new. Verify against official GitHub releases if changing them.
4. **Formatting scopes:** Root `prettier --check .` can traverse `web/` unless excluded; `web/` also uses its own Prettier version. Compare ignore files, accidental generated output and exact failed paths. Prefer distinct intentional root/web scopes rather than repeatedly reformatting one package using two versions. Preserve user prompt files and do not simply ignore failing source files.
5. **Case sensitivity:** Linux paths/imports may differ from Windows case-insensitive resolution. Correct source/import casing consistently.
6. **TypeScript/Next:** Check generated `.next/types`, `next typegen`, core build dependency order, `web` import paths, `server-only` boundaries and app route types. Keep real type checking intact.
7. **ESLint/Vitest:** Check installed version differences, fixture races, OS-specific path separators/timezones, mock network safety and reproducible test behavior; never use `|| true` or skip the failing tests.
8. **Secrets/config:** Standard CI should be offline and not require `TYPESAFE_API_KEY` or repository-write credentials. If a test calls Jev or GitHub unexpectedly, use injected fakes and explicit opt-in live scripts. Never bypass a legitimately required live check by claiming it ran.
9. **Workflow permissions/triggers:** Keep least privileges for normal CI (`contents: read`); retain separate issue-triage permissions/logic. Do not disable CI on pull requests or `main` simply to get a green badge.

## 5. Implement a minimal repair

- Branch safely from verified `main` as `fix/ci-workflows` (reuse a pre-existing branch safely after inspection).
- Change only files actually implicated by the logs/reproduction; explain each changed line's purpose.
- If the first failure is in the workflow itself, fix that root cause before touching application logic.
- If both root and web checks fail, establish whether one shared source/setup defect or two independent issues exist.
- Keep both lockfiles committed and reproducible.
- Preserve root Jev integration, five typed decisions, confidence policy, GitHub issue workflow, evaluation suite and dashboard functionality.
- Preserve the Coastal Mist light theme, fonts and accessibility.
- Never replace Jev with an OpenAI runtime API or create a fake passing check.
- Keep normal CI completely network-inference-free; npm dependency installation is expected, but live Jev inference is not.

## 6. Add regression protection and validate everything

After fixes, run again:

```bash
npm ci
npm run check
npm --prefix web ci
npm --prefix web run check
npm run eval -- --mode fixture
npm run triage -- --help
git diff --check
git status --short
git diff --stat
```

Where practical, run exact root/web CI sequences under Linux or a matching Node version, especially if failures occurred only on GitHub. Avoid adding a heavyweight new test/dependency merely for a small CI bug. Validate workflow YAML and action references without exposing credentials. If using a local temporary fixture, remove only files created by the current test, never untracked user files.

Add or adjust targeted regression tests when a code defect was found, and confirm the pre-existing suite still passes. Inspect both root and web lockfiles in the staged diff.

## 7. GitHub verification — don't merge red CI

1. Review changes and secrets, then commit to `fix/ci-workflows` with a meaningful message such as `fix(ci): restore root and web checks`.
2. If the authenticated remote is clearly the intended user-owned GitHub remote and the user has authorized publishing the fix, push a normal branch and open/update one PR. **Do not push/merge without authorization.** Otherwise give the user the exact non-force commands and stop after local verification.
3. Observe the new PR's actual GitHub Actions status. Verify **both** `check` and `web` jobs pass on the new commit. If either fails, retrieve its failed log, repair and repeat; never merge a red PR.
4. After authorization, merge the PR normally only when the user-approved merge and required checks are green. Observe the resulting `main` CI run and confirm both jobs again. Do not claim remote green unless the host shows it.
5. Existing historic red runs remain historical; no need to delete, rerun all 17, or rewrite history.
6. If GitHub permissions, branch protection or no authentication block a remote test, report `BLOCKED` and list the exact action needed.

## 8. Required documentary deliverable

Create or update `docs/CI_FAILURE_INVESTIGATION.md` with sanitized, reproducible evidence:

- date, inspected branch/commit, affected run IDs/URLs;
- original failure(s), first failed step(s) and minimal log excerpts;
- established root cause and changes made;
- actual local root and web command results with test counts;
- actual remote PR/main check statuses if observed, otherwise `NOT VERIFIED`;
- remaining limitations and steps to rerun;
- confirmation that no real Jev inference or GitHub issue mutation occurred during standard CI.

Do not include a real token, API key, private issue content or made-up screenshots.

## 9. Final factual report to the user

```text
JevFlow — CI Repair Report
Repository/branch/commit: ...
Remote run logs: READ / UNAVAILABLE (actual IDs and reason)
Root CI failure: [exact first failed step and factual root cause]
Web CI failure: [exact first failed step and factual root cause]
Changed files: ...
Local npm ci: PASS / FAIL / BLOCKED
Root npm run check: PASS / FAIL / BLOCKED; actual test count
Web npm --prefix web run check: PASS / FAIL / BLOCKED; actual test count
Fixture evaluation: ...
Git diff / secrets review: ...
Commit hash: ... / not committed (reason)
PR URL and job status: ... / not published (reason)
main CI status: ... / not verified (reason)
Issue triage workflow unchanged: YES / NO (justification)
Outstanding blockers: ...
Next: verify new PR + main run, then continue project testing.
```

**Execute the CI investigation/repair only. Do not start new feature development.**

### Official references

- GitHub Actions troubleshooting: https://docs.github.com/en/actions/how-tos/troubleshoot-workflows
- GitHub workflow logs: https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/using-workflow-run-logs
- GitHub Actions workflow syntax: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- JevFlow source CI: https://github.com/divejikan-yuvarajah/JevFlow/blob/main/.github/workflows/ci.yml
