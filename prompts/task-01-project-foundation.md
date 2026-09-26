# JevFlow — Task 01: Project Foundation & Configuration (Codex Edition)

> **OPENAI CODEX / VS CODE IMPLEMENTATION PROMPT — EXECUTE TASK 01 ONLY**
> Project: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**
> Roadmap: **Task 01 of 07 (after the separate Setup Phase)**
> Repository: the **main `jevflow` source repository**, never `jevflow-test-repo`
> Working branch: `feat/project-foundation`
> Target runtime: **Node.js 20+, npm, strict TypeScript ESM**
> Coding assistant: **OpenAI Codex**. Application inference provider, beginning Task 02: **TypeSafe AI Jev**.

---

## 0. How to execute this file

The user has already been given a **separate Setup Phase — Codex Edition**. This task must build on that setup rather than repeat it. The expected repository has `AGENTS.md`, `README.md`, `docs/roadmap.md`, `docs/codex-workflow.md`, `prompts/README.md`, and a valid Git `main` baseline. **Inspect reality; never assume those files are present or correct.**

Place this file at `prompts/task-01-project-foundation.md` inside the main JevFlow VS Code workspace. Reference it in a new Codex conversation. Codex should read the entire file plus root `AGENTS.md` and relevant existing docs before editing. A local filename/attachment may differ; reference the actual file path in that case.

The task is execution, not advice: inspect, safely branch, write working code, run commands, fix task-caused failures, review diffs, commit/merge if safe, and report the observed outcome. If the Setup Phase has not happened, **do not silently create a second setup or overwrite user files**. Report what is absent, implement only safe Task 01 work where possible, and identify the blocker.

### Non-negotiable distinction

- **Codex** edits and tests the software; no OpenAI API integration is needed.
- **Jev** will be the real application's inference provider starting in Task 02.
- Do not implement or impersonate Jev in this task. Do not create fake model probability data.

---

## 1. Objective and success definition

Create a clean, runnable and testable Node.js/TypeScript foundation, ready to receive the real Jev SDK in Task 02. Task 01 must produce:

1. A safe, verified feature-branch implementation that preserves Setup Phase files.
2. A single npm/TypeScript ESM root project with committed lockfile.
3. Canonical issue classification domain constants/types (but no classifier).
4. Config loading and validated confidence thresholds with optional, non-logged secrets.
5. A truthful bootstrap CLI that works **without credentials and without network access**.
6. Strict typing, formatting, linting, unit tests, build and CI.
7. Brief accurate architecture/development docs and updated roadmap status.
8. Final evidence from actual command output and an honest Git report.

**This phase does not triage an issue, call an API, assign GitHub labels or build a web app.**

---

## 2. Preflight — inspect before edits

Read `AGENTS.md` and inspect the real workspace and repository. Run the platform-equivalent commands for:

```bash
pwd
ls -la                       # PowerShell: Get-ChildItem -Force
git status --short
git branch -a
git log --oneline -5
git remote -v
node --version
npm --version
git --version
```

Also inspect existing `README.md`, `.gitignore`, `docs/roadmap.md`, `docs/codex-workflow.md`, `prompts/README.md`, existing `package.json` and configuration files if any.

**Must-stop safeguards:**

- If this is `jevflow-test-repo` or another unrelated repository, stop without changing it.
- If an operation may lose uncommitted changes or overwrite a pre-existing source/config file, stop that operation and report the concern; do not discard work.
- If Git identity is not configured and a commit cannot be made, report it accurately; don't invent an identity.
- If Node is older than 20 or npm unavailable, report the installation requirement. Do not claim validation succeeded.
- Do not access a remote GitHub repository or create one unless the user already configured an intended remote and explicitly authorized the operation. No force pushes.

Before implementation, identify the existing Setup Phase files so they can be preserved. Keep `AGENTS.md` as the single source of persistent Codex rules. **Do not rewrite or duplicate the whole `AGENTS.md`**; make the smallest warranted correction only if it conflicts with the implementation, and explain it.

---

## 3. Safe Git workflow — mandatory

Use a feature branch named exactly:

```text
feat/project-foundation
```

Expected case: Setup Phase is committed on `main`, and the working tree is clean. In that case:

```bash
git switch main
# If there is a verified intended upstream, optionally git pull --ff-only.
git switch -c feat/project-foundation
```

If the branch exists, inspect and reuse it safely rather than replacing it. If `main` is missing, the Setup Phase may be incomplete; do not reset or destructively repair history. Never use `git reset --hard`, `git clean -fd`, or any force push. Do not silently stash changes. Treat branch creation/merge commands as conditional on the real repository state.

Do all implementation on the feature branch. Before committing, inspect `git diff`, `git status`, staged files and accidental secrets. Commit with a meaningful message, e.g.:

```text
chore: establish JevFlow TypeScript foundation
```

After all required checks pass, merge safely into `main` using a normal merge (such as `git merge --no-ff feat/project-foundation`), re-run `npm run check` on `main`, and verify clean status. Do not merge if tests fail or the worktree/branch state makes it unsafe. No automatic remote push unless already expressly authorized by the user. If unable to commit/merge, leave completed files intact and report the reason.

---

## 4. Final architecture contract

The expected later application pipeline is:

```text
GitHub issue event [Task 04]
    → typed input + bounded Jev state [Task 02]
    → real Jev SDK structured decisions [Task 02]
    → normalized typed results/probabilities [Task 02]
    → deterministic confidence and review policy [Task 03]
    → canonical proposed labels [Task 03]
    → GitHub mutations and action summary [Task 04]
```

Keep application-domain types separate from Jev-specific transport, deterministic policy, and GitHub/network side effects. **Do not invent an SDK response schema before examining the actual SDK in Task 02.**

The independent disposable `jevflow-test-repo` is reserved for Task 04 integration tests. Do not copy or merge its application into JevFlow; do not create issues or label anything now.

---

## 5. Dependencies and build choices

Use stable, mutually compatible packages available in the current environment; inspect package documentation/tool errors instead of guessing deprecated version combinations.

**Required:**

- Node.js **20 or newer**; project baseline `.nvmrc` should say `20` (current installed newer Node is acceptable when supported).
- Single npm root package and `package-lock.json` committed.
- TypeScript strict mode, NodeNext-style ESM, `"type": "module"`.
- `tsx` for development-time TypeScript CLI.
- `dotenv` for local `.env` loading (or a clearly justified safe compatible equivalent).
- `@types/node` as needed.
- Vitest for tests.
- ESLint with correct compatible TypeScript support.
- Prettier for formatting.

Prefer minimal dependencies. Do **not** add `@typesafe-ai/sdk`, Octokit, Next.js, Tailwind, databases, authentication libraries or the OpenAI SDK in Task 01. The optional Next.js playground belongs to Task 06; do not create a monorepo now.

Use `.js` specifiers in relative TS ESM source imports where needed for compiled NodeNext output, so direct `node dist/...` runs instead of only `tsx` succeeding. Avoid suppressing compiler/lint errors or disabling strictness to make the build pass.

---

## 6. File structure to create or adapt

Preserve the existing Setup Phase `AGENTS.md`, docs, and user-owned prompt files. Build this structure, making small adjustments only when justified by actual repository conventions:

```text
jevflow/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .vscode/                     # preserve setup, if present
├── docs/
│   ├── roadmap.md               # update actual phase status
│   ├── codex-workflow.md        # preserve setup content
│   ├── architecture.md
│   ├── decisions.md
│   └── development.md
├── prompts/                     # preserve Task 01 file and user-provided prompts
│   └── README.md
├── src/
│   ├── cli/
│   │   └── index.ts
│   ├── config/
│   │   └── env.ts
│   ├── domain/
│   │   ├── constants.ts
│   │   └── issue.ts
│   ├── jev/                      # future module boundary, no fake implementation
│   ├── triage/                   # future module boundary
│   ├── policy/                   # future module boundary
│   ├── github/                   # future module boundary
│   └── utils/                    # only if genuinely needed
├── tests/
│   ├── config.test.ts
│   └── domain.test.ts
├── AGENTS.md
├── .env.example
├── .gitignore
├── .nvmrc
├── .prettierignore
├── .prettierrc.json
├── eslint.config.js             # or compatible config
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

Git does not track empty folders; if reserving later module boundaries, add a short README or `.gitkeep` only where useful. Do not generate fake `client.ts`, `analyzeIssue.ts`, or implementation stubs returning made-up AI results. Do not overwrite the Task 01 prompt currently being executed. Keep `prompts/` documentation in Git, but ensure formatter scope is intentional rather than unexpectedly rewriting long task prompts.

---

## 7. Canonical domain types — implement exactly once

Define the canonical choices as immutable literal arrays/objects (using `as const` and inferred unions, avoiding scattered duplicate strings):

```ts
ISSUE_TYPES = ['bug', 'feature', 'documentation', 'question', 'maintenance']
ENGINEERING_AREAS = ['frontend', 'backend', 'database', 'devops', 'ai', 'security', 'general']
PRIORITIES = ['critical', 'high', 'medium', 'low']
AUTOMATION_MODES = ['auto', 'review-suggested', 'human-review']
```

Use sensible export names with TypeScript inferred union types, such as `IssueType`, `EngineeringArea`, `IssuePriority`, and `AutomationMode`. This is the app's authoritative vocabulary for Tasks 02–07; do not create parallel incompatible enums.

Expose an app-level `IssueInput` with:

```ts
{
  title: string;
  body: string;
  issueNumber?: number;
  issueUrl?: string;
  repository?: string;
}
```

Document title/body as untrusted external input. Do not implement the later bounded Jev state builder or assert that all possible issue content is safe. No fake `TriageResult` raw-provider interface or made-up probability fields in Task 01.

---

## 8. Environment and security

Create or extend `.env.example` with placeholders only:

```dotenv
# Not needed for Task 01 bootstrap; real Jev requests start Task 02.
TYPESAFE_API_KEY=

# Reserved for optional local GitHub integrations; GitHub Actions will use its own GITHUB_TOKEN.
GITHUB_TOKEN=

# Configurable later application policy values, inclusive range 0..1.
AUTO_THRESHOLD=0.90
REVIEW_THRESHOLD=0.75
```

Provide a typed config reader in `src/config/env.ts` with dependency-injected environment values for deterministic testing; default to process environment for the actual CLI. Using `dotenv/config` or a controlled `dotenv.config()` in the CLI is fine; avoid contaminating tests with the real user's `.env`.

**Config behavior:**

1. Missing/empty threshold values use defaults `0.90` and `0.75`.
2. Trim values and parse only finite numbers; reject invalid strings, `NaN`, infinity and out-of-range values.
3. Accept inclusive `[0, 1]` for both thresholds.
4. Reject configurations with `REVIEW_THRESHOLD > AUTO_THRESHOLD`.
5. Keep secrets optional during this phase and expose only to future server-side consumers.
6. Never log, stringify, include in thrown messages, snapshots or README any secret value.
7. Errors can name invalid **variable names**, but must avoid echoing user-provided secret values.

Update `.gitignore` to protect `.env`, `.env.*` (except `.env.example`), `node_modules/`, `dist/`, coverage, logs, OS junk and appropriate editor junk; do not ignore `package-lock.json`, `AGENTS.md`, `prompts/`, or `.env.example`. Preserve any useful existing ignore rules. Optionally add a small automated test for safe config output.

---

## 9. Honest runnable bootstrap CLI

Create `src/cli/index.ts` and script `npm run dev` which runs locally with **no API keys and no external network call**.

Suggested truthful output (wording can differ):

```text
JevFlow — foundation ready
Mode: local bootstrap only (no Jev/GitHub requests)
Node runtime: 20+
Automatic threshold: 0.90
Review threshold: 0.75
Next phase: Task 02 — real Jev SDK integration
```

Avoid showing key values. Validate config before indicating success. On an invalid threshold, use a sanitized error and non-zero exit code. If reporting key availability, display only `configured/not configured`, never raw values. Do not synthesize issue classifications. The compiled `npm start` must invoke Node on emitted JS and work directly; the TS development CLI must not be the only functional entry.

---

## 10. npm scripts and configs

Implement these user-facing scripts with compatible underlying commands:

| Command | Required behavior |
|---|---|
| `npm run dev` | Run truthful local bootstrap with `tsx` |
| `npm run build` | Compile `src/` into executable `dist/` |
| `npm start` | Execute compiled Node JS bootstrap |
| `npm run typecheck` | Strict no-emit typecheck |
| `npm run lint` | Lint source/test/config as appropriate |
| `npm run format` | Format intended project-owned source/config/docs scope |
| `npm run format:check` | Check formatting without rewriting |
| `npm test` | Run offline Vitest suite once |
| `npm run test:watch` | Local Vitest watch mode |
| `npm run check` | Format check → typecheck → lint → tests → build |

Use `tsconfig.json` and `tsconfig.build.json` if beneficial to exclude tests from `dist/`; make ESM/NodeNext compiler settings internally consistent. Do not add `|| true`, mute test errors, weaken linting, or use sweeping `any` to get a green status. Prettier must not unexpectedly reformat the user-provided prompt files; document its intended scope/ignore behavior.

Use `npm install` as appropriate to generate `package-lock.json`; verify `npm ci` works from that lockfile. Do not assume a guessed dependency version will install on all Node versions.

---

## 11. Meaningful mandatory tests (offline)

Use Vitest and keep tests fast, deterministic, and network-free. Cover at least:

1. Default thresholds when values are missing and empty.
2. Valid custom threshold parsing, including boundary values 0 and 1.
3. Rejection of alphabetic values, whitespace-only weird inputs if applicable, `NaN`, infinity, negative numbers and values over 1.
4. Rejection when `REVIEW_THRESHOLD > AUTO_THRESHOLD`.
5. Secret material never appears in sanitized config errors.
6. Canonical arrays contain the defined options, contain no duplicates and inferred guards behave as intended if implemented.
7. CLI bootstrap accepts absent API credentials and does not claim real Jev or GitHub work.

Do not write meaningless tests or network calls. Do not report a future live API smoke test as executed. If `process.env` is mutated in an isolated CLI test, restore it so tests do not contaminate one another.

---

## 12. CI — foundation only

Create `.github/workflows/ci.yml` with:

- trigger on push to `main` and pull requests targeting `main`;
- permissions limited to `contents: read`;
- checkout, Node.js 20 setup with npm caching, `npm ci`, `npm run check`;
- no secret required and no TypeSafe/GitHub API call;
- no issue-triggered triage workflow yet — that belongs to Task 04.

Ensure workflow YAML is valid and the `npm ci` dependency-lock condition is satisfied. Do not enable broad write permissions or interpolate untrusted issue text anywhere.

---

## 13. Documentation to create/update

### `README.md`

Preserve the concise setup identity but revise it for the completed foundation. Include:

- name/tagline, real problem, concise planned flow;
- *implemented in Task 01* versus *planned later* distinction;
- environment requirements;
- `npm install`, optional `.env` copy, `npm run dev`, `npm run check`, `npm run build`, `npm start`;
- no TypeSafe API key is needed to run this phase;
- main `jevflow` versus disposable `jevflow-test-repo` separation;
- links to architecture, development and roadmap docs.

### `docs/architecture.md`

Explain module boundaries and planned data flow; clearly separate Jev prediction, domain normalization, policy and GitHub effects. Do not claim that the SDK output shape was already verified.

### `docs/decisions.md`

Record decisions: Node.js 20+, npm, TypeScript ESM, single root package, no DB for MVP, local-only bootstrap, future TypeSafe SDK in Task 02, future confidence policy in Task 03, real GitHub automation in Task 04 and optional Next.js UI in Task 06.

### `docs/development.md`

Explain scripts, Git branch workflow, secret handling and how to run offline tests. Preserve `docs/codex-workflow.md` from setup rather than duplicating all of it.

### `docs/roadmap.md`

Update only accurate status. After Task 01 is fully implemented and verified, indicate Setup Phase complete and Task 01 complete, Tasks 02–07 not started. If verification/merge is blocked, record *in progress / blocked* and say why. Do not misrepresent completion.

### `AGENTS.md`

Read and follow. Only make minimal factual compatibility edits if necessary; do not overwrite setup instructions or invent task instructions for future phases.

---

## 14. Execution sequence

1. Inspect workspace, `AGENTS.md`, setup docs, repository status, runtime/toolchain and existing files.
2. Verify the current directory is `jevflow`, not the test repository.
3. Branch safely to `feat/project-foundation` from the valid Setup Phase `main` baseline.
4. Set up npm, TypeScript ESM and compatible minimal dev/runtime dependencies; commit lockfile.
5. Add scripts and strict typecheck/lint/format/build/test config.
6. Implement canonical domain constants/types.
7. Implement typed, safe environment config with tests.
8. Implement truthful bootstrap CLI; verify development and compiled commands.
9. Add GitHub CI and concise docs; carefully update roadmap.
10. Run `npm run format`, review any formatter changes and their scope; then all checks below.
11. Repair any Task 01-caused failures; never conceal errors or fabricate results.
12. Review staged/untracked files and secrets; commit the feature branch safely.
13. If all checks pass and Git is safe, merge to `main`, re-run checks and confirm status.
14. Stop without implementing Task 02.

---

## 15. Required verification commands

Run, observe and accurately report each command separately (platform equivalents allowed):

```bash
node --version
npm --version
npm run dev
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm start
npm run check
npm ci
npm run check

git diff --check
git status --short
```

The `npm ci` verification may be run before the final checks so the full suite is tested against the committed lockfile. Inspect `git diff --cached` before committing; do not leak real `.env` values or tokens in logs/reports. If a command is blocked by missing local tooling, permissions or network for installing dependencies, state `NOT RUN/BLOCKED`, not `PASS`. Do not claim CI executed in GitHub unless a real remote workflow actually ran; local validation of the workflow file is not the same as GitHub-hosted CI.

---

## 16. Out-of-scope and safety restrictions

**Do not:**

- implement `@typesafe-ai/sdk`, call Jev, create fake decision probabilities, or set up an OpenAI runtime classifier;
- mutate GitHub issues, create GitHub labels or create the Task 04 triage-on-issue workflow;
- build an API server, dashboard, auth, Docker or DB;
- copy or overwrite `jevflow-test-repo`;
- overwrite prompt files or unrelated work;
- print/commit real secrets;
- use destructive Git cleanup/force commands;
- bypass validation to declare success;
- auto-push or create remote repositories without the user's authorization;
- jump ahead to Task 02 after finishing Task 01.

Implement the foundation in simple testable modules, favoring correct runnable code over premature abstraction.

---

## 17. Acceptance criteria (check all before claiming complete)

- [ ] Correct main JevFlow repo, existing Setup Phase assets preserved.
- [ ] Feature branch workflow respected; no unrelated edits or destroyed user changes.
- [ ] Node 20+ and npm/TypeScript ESM project configured.
- [ ] `package.json` and committed, valid `package-lock.json` present.
- [ ] Canonical issue types, engineering areas, priorities and automation modes defined once.
- [ ] `.env.example` has placeholders; secret files ignored.
- [ ] Strict typed config defaults and rejects malformed thresholds.
- [ ] Bootstrap works without credentials/network; no fake Jev output.
- [ ] Offline meaningful tests pass; direct compiled `npm start` passes.
- [ ] `npm run typecheck`, `lint`, `format:check`, `test`, `build`, `check` pass.
- [ ] `npm ci` and subsequent `npm run check` succeed.
- [ ] CI workflow exists with minimum permissions and no triage trigger.
- [ ] README and architecture/dev/decision docs accurately mark implemented vs planned.
- [ ] Roadmap status is truthful.
- [ ] Diff and secret inspection done; commit/merge status accurately reported.
- [ ] No Jev SDK/API, GitHub mutation, dashboard or Task 02 implementation added.

---

## 18. Required final response from Codex

Do not merely say “Done.” Report only real observed results in the format:

```text
JevFlow — Task 01 Implementation Report

Repository/workspace: ...
Node/npm: ...
Initial Git state: ...
Branch used: feat/project-foundation

Implemented:
- ...

Files created/modified:
- ...

Validation (observed, not assumed):
- npm run dev: PASS / FAIL / NOT RUN (why)
- npm run typecheck: ...
- npm run lint: ...
- npm run format:check: ...
- npm test: ... (actual number of tests)
- npm run build: ...
- npm start: ...
- npm ci: ...
- npm run check: ...
- git diff --check: ...

Security/secret inspection: ...
Commit: <real hash or blocked explanation>
Merge into main: YES/NO; why
Current working tree: CLEAN/DIRTY; details
Remote push: NOT PERFORMED unless separately authorized and verified
Outstanding blockers/deviations: ...

Explicit confirmation: Task 02 has NOT been implemented.
Next: Task 02 — Jev Integration & Intelligent Triage Engine.
```

**EXECUTE TASK 01 ONLY, THEN STOP.**
