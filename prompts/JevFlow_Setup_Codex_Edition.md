# JevFlow — Setup Phase: VS Code + OpenAI Codex Edition

> **Execute SETUP PHASE ONLY. Do not implement Task 01 or any JevFlow product features yet.**  
> Project: **JevFlow — Confidence-Aware GitHub Issue Triage powered by Jev**  
> Development environment: **Visual Studio Code + OpenAI Codex extension**  
> Coding assistant: **OpenAI Codex**  
> Application AI / inference engine: **TypeSafe AI Jev**  
> Runtime target for later phases: **Node.js 20+, TypeScript ESM, npm**

---

## 0. Your role

Act as a senior software engineer and repository maintainer preparing a brand-new JevFlow development workspace for the upcoming seven-phase implementation.

You are running through the **OpenAI Codex extension inside VS Code**.

Your job in this setup phase is to:

- inspect the current workspace,
- safely initialize the repository if necessary,
- establish the Codex-specific repository instructions,
- create the prompt/document structure,
- define the seven-phase development roadmap,
- establish safe Git conventions,
- establish validation and code-quality rules for future phases,
- prepare documentation and placeholders needed by future prompts,
- verify the workspace is ready for Task 01.

Do **not** implement Jev SDK integration, issue classification, confidence policy, GitHub automation, dashboard features, benchmarking, or release features in this setup phase.

---

# 1. Critical architecture rule

Keep this distinction clear throughout the entire project:

```text
OpenAI Codex
    ↓
Development assistant only
    ↓
Writes/reviews/tests the JevFlow code

TypeSafe AI Jev
    ↓
Runtime inference system used by JevFlow
    ↓
Makes typed issue-triage decisions
```

**Never replace Jev with OpenAI API calls.**

The fact that Codex is helping develop the project does not mean OpenAI models become the application's inference provider.

Do not install OpenAI SDKs merely because Codex is being used as the coding assistant.

---

# 2. Final JevFlow product context

JevFlow will eventually provide confidence-aware GitHub issue triage.

Planned final flow:

```text
GitHub Issue Opened
        ↓
GitHub Actions
        ↓
Issue Event Parser
        ↓
JevFlow Issue State Builder
        ↓
TypeSafe AI Jev
        ↓
Typed Decisions
        ↓
Confidence Policy Engine
        ↓
GitHub Labels / Human Review
        ↓
Triage Summary
```

Planned decision families:

```text
Issue Type
- bug
- feature
- documentation
- question
- maintenance

Engineering Area
- frontend
- backend
- database
- devops
- ai
- security
- general

Priority
- critical
- high
- medium
- low

Security Sensitive
- probabilistic yes/no decision

Human Review Required
- probabilistic yes/no decision
```

The project will later apply deterministic confidence thresholds and GitHub automation on top of Jev's structured decisions.

---

# 3. Seven-phase development roadmap

The project must follow this consolidated roadmap.

## Setup Phase — current phase

Prepare:

- VS Code + Codex repository workflow
- `AGENTS.md`
- prompt folder
- roadmap documentation
- safe Git conventions
- workspace verification

Do not implement product logic.

---

## Task 01 — Project Foundation & Configuration

Will later implement:

- Node.js 20+ project
- TypeScript ESM
- npm
- environment configuration
- canonical domain constants/types
- ESLint
- Prettier
- Vitest
- initial CI
- bootstrap CLI
- base documentation

Target branch:

```text
feat/project-foundation
```

---

## Task 02 — Jev Integration & Intelligent Triage Engine

Will later implement:

- official TypeSafe AI Jev SDK
- issue state construction
- typed Jev decision questions
- issue analysis service
- result validation
- normalized triage output
- optional live smoke test

Target branch:

```text
feat/jev-engine
```

---

## Task 03 — Confidence Policy, Labels & CLI

Will later implement:

- confidence thresholds
- policy engine
- auto / review-suggested / human-review modes
- security escalation
- label mapping
- local triage CLI
- fail-safe behavior

Target branch:

```text
feat/confidence-policy
```

---

## Task 04 — GitHub Integration & Automation

Will later implement:

- GitHub issue event parser
- GitHub API integration
- label reconciliation
- issue automation
- GitHub Actions workflow
- action summary
- deployment template for `jevflow-test-repo`

Target branch:

```text
feat/github-automation
```

---

## Task 05 — Testing, Evaluation & Benchmarking

Will later implement:

- evaluation dataset
- test fixtures
- accuracy calculations
- latency metrics
- confidence analysis
- automation coverage
- human-review escalation metrics

Target branch:

```text
test/evaluation-suite
```

---

## Task 06 — Web Playground & Decision Dashboard

Optional presentation layer.

Will later implement:

- Next.js playground
- issue input form
- server-side Jev request path
- decision cards
- confidence visualization
- policy visualization
- responsive UI

Target branch:

```text
feat/demo-dashboard
```

---

## Task 07 — Documentation, Final QA & Release

Will later implement:

- polished README
- architecture documentation
- screenshots
- demo scenarios
- release checklist
- final security review
- GitHub release preparation
- LinkedIn/demo preparation

Target branch:

```text
docs/release
```

---

# 4. Repository separation rule

There are two repositories in the overall project workflow.

## Main repository

```text
jevflow
```

Purpose:

- contains the actual JevFlow source code
- contains the inference engine integration
- contains the policy engine
- contains GitHub automation
- contains tests
- contains documentation
- contains the optional dashboard

## Disposable testing repository

```text
jevflow-test-repo
```

Purpose:

- contains sample GitHub issues
- used only for real-world automation testing
- safe target for label creation and issue triage
- must remain separate from the JevFlow source repository

### Mandatory rule

If the current workspace is `jevflow-test-repo`, **stop immediately** and report that the wrong repository has been opened.

Never merge the test repository into the main JevFlow source repository.

---

# 5. Setup preflight

Before changing anything, inspect:

```bash
pwd
ls
git status
git branch -a
git remote -v
node --version
npm --version
code --version
```

On Windows PowerShell, adapt commands where necessary.

Check whether:

- this directory is already a Git repository,
- there are existing user files,
- there are uncommitted changes,
- `main` already exists,
- a remote already exists,
- Node.js is installed,
- Node.js is version 20 or newer,
- npm is available,
- VS Code is running in the correct project folder.

Do not assume the workspace is empty.

Do not delete or overwrite unknown files.

---

# 6. Safe Git rules

These Git rules apply to the entire project and should be written into repository instructions.

## Never use automatically

Do not run:

```bash
git reset --hard
git clean -fd
git push --force
git push --force-with-lease
```

unless the user explicitly requests a destructive recovery operation.

Never discard uncommitted user work.

Never silently rewrite Git history.

---

## Initial repository setup

If there is no Git repository:

```bash
git init
git branch -M main
```

Create only the minimal setup files from this phase.

Then create an initial commit such as:

```text
chore: initialize JevFlow Codex workspace
```

Do not create Task 01 implementation code yet.

---

## Feature branch workflow for later tasks

All future development tasks must follow:

```text
main
 ↓
feature branch
 ↓
inspect current implementation
 ↓
implement one task only
 ↓
format
 ↓
typecheck
 ↓
lint
 ↓
tests
 ↓
build
 ↓
review diff
 ↓
commit
 ↓
merge into main
 ↓
verify main
```

Do not automatically delete a branch until the merge is verified.

Do not claim a merge or push happened unless it actually happened.

---

# 7. Create Codex repository instructions

Create:

```text
AGENTS.md
```

at the repository root.

It must contain repository-wide rules for Codex.

Use content equivalent to the following.

---

## Required `AGENTS.md`

```markdown
# JevFlow — Codex Repository Instructions

## Project

JevFlow is a confidence-aware GitHub issue triage system powered by TypeSafe AI Jev.

OpenAI Codex is used only as the software development assistant.

TypeSafe AI Jev is the runtime inference provider.

Never replace Jev with the OpenAI API.

---

## Working Rules

Before modifying code:

1. Inspect the existing repository.
2. Read relevant existing files.
3. Review `git status`.
4. Preserve all completed functionality.
5. Execute only the explicitly requested development phase.

Do not implement later phases early.

Do not rebuild working modules unnecessarily.

---

## Architecture Principles

Keep these layers separate:

- domain types
- Jev integration
- triage normalization
- deterministic policy
- GitHub side effects
- presentation/dashboard

Do not mix GitHub API calls into Jev inference code.

Do not mix confidence-policy logic into UI code.

Do not duplicate canonical enums or label definitions.

Prefer small typed modules over large files.

---

## TypeScript

Use strict TypeScript.

Avoid `any` unless absolutely unavoidable and documented.

Prefer:

- explicit domain types
- discriminated unions where useful
- immutable constants
- dependency injection for side-effect services
- pure functions for policy and normalization
- ESM-safe imports

---

## Secrets

Never commit:

- API keys
- tokens
- `.env`
- credentials
- GitHub PATs

Never print secret values in logs.

Use `.env.example` with placeholders only.

---

## Git

Use one feature branch per development phase.

Never use destructive Git commands automatically.

Never force push.

Never discard existing uncommitted changes.

Before merging:

- run all available validation commands
- inspect the diff
- confirm no secrets were added
- ensure unrelated files were not modified

---

## Validation

When scripts exist, run the relevant checks:

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
```

Prefer a project-wide:

```bash
npm run check
```

when available.

Fix failures introduced by the current task.

Do not hide failures by weakening configuration.

---

## Development Roadmap

Execute only one phase at a time:

1. Project Foundation & Configuration
2. Jev Integration & Intelligent Triage Engine
3. Confidence Policy, Labels & CLI
4. GitHub Integration & Automation
5. Testing, Evaluation & Benchmarking
6. Web Playground & Decision Dashboard
7. Documentation, Final QA & Release

---

## External Test Repository

`jevflow-test-repo` is a separate disposable repository.

Never treat it as the main JevFlow source repository.

Never merge it into this repository.

Only use it during explicit GitHub automation testing.

---

## Final Report for Every Task

At the end of each task report:

1. Files created and modified
2. Main functionality implemented
3. Validation commands executed
4. Actual test/build results
5. Git branch
6. Commit hash if committed
7. Merge status
8. Remaining blockers
9. Exact next development phase

Never claim work that was not actually performed.
```

---

# 8. Prompt organization

Create this folder:

```text
prompts/
```

Prepare the intended structure:

```text
prompts/
├── README.md
├── task-01-project-foundation.md
├── task-02-jev-integration.md
├── task-03-confidence-policy.md
├── task-04-github-automation.md
├── task-05-evaluation.md
├── task-06-dashboard.md
└── task-07-release.md
```

### Important

Do **not** invent or write the full future task prompts during this setup phase unless the files have already been supplied by the user.

If the Task 01–04 prompt files already exist outside the repository and are available to the workspace, copy them only if the user has intentionally placed/provided them.

Otherwise:

- create only `prompts/README.md`,
- document the expected filenames,
- do not create fake placeholder prompts that Codex could accidentally execute.

A good `prompts/README.md` should explain:

```text
Each prompt represents one development phase.

Execute prompts sequentially.

Never run multiple phase prompts at once.

Before starting a phase:
- ensure previous phase is merged,
- ensure working tree is clean,
- read AGENTS.md,
- inspect the current repository.
```

---

# 9. Create project roadmap documentation

Create:

```text
docs/roadmap.md
```

This file should contain:

- project goal
- high-level architecture
- seven development phases
- branch names
- current phase status
- separation between JevFlow and `jevflow-test-repo`

Initial status should be:

```text
Setup Phase: Complete after this prompt succeeds
Task 01: Not Started
Task 02: Not Started
Task 03: Not Started
Task 04: Not Started
Task 05: Not Started
Task 06: Not Started
Task 07: Not Started
```

Do not mark setup complete until verification succeeds.

---

# 10. Create development workflow documentation

Create:

```text
docs/codex-workflow.md
```

Explain how the user should execute future tasks in VS Code with Codex.

Include the recommended pattern:

```text
Read AGENTS.md first.

Then read and execute:
prompts/task-XX-....md

Execute that task only.

Inspect existing implementation before editing.

Run all required validation.

Do not implement later phases.

At the end provide:
- implementation summary
- tests
- Git status
- commit
- merge result
- next task
```

Include a generic Codex instruction example:

```text
Read AGENTS.md and the complete instructions in
prompts/task-01-project-foundation.md.

Execute Task 01 only.

Inspect the current repository first.
Preserve existing work.
Implement the task completely.
Run all required checks.
Report the actual results.

Do not implement Task 02 or any later phase.
```

---

# 11. VS Code project settings

Create a minimal:

```text
.vscode/
```

Only if useful and non-invasive.

Recommended files:

```text
.vscode/
├── extensions.json
└── settings.json
```

## `extensions.json`

Recommend only useful development extensions.

Do not hard-depend on large extension packs.

Suggested categories:

- ESLint
- Prettier
- GitHub Actions YAML support if appropriate

Do not invent an extension identifier for Codex unless it is already installed and its exact official identifier can be verified locally.

Codex does not need to be listed in `extensions.json` for the repository to function.

---

## `settings.json`

Keep settings minimal.

Reasonable future-oriented settings:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true
  }
}
```

Only add settings that do not interfere with user preferences unnecessarily.

If ESLint/Prettier have not yet been installed, it is still acceptable to defer formatter-specific workspace settings until Task 01.

---

# 12. Root README for setup phase

Create or update:

```text
README.md
```

At this stage keep it intentionally small.

It should say:

```text
JevFlow
Confidence-Aware GitHub Issue Triage powered by Jev

Current status:
Development workspace prepared.
Product implementation begins with Task 01.

Development environment:
VS Code + OpenAI Codex

Runtime AI:
TypeSafe AI Jev

Roadmap:
See docs/roadmap.md
```

Do not claim features are already implemented.

Do not describe JevFlow as production-ready.

---

# 13. `.gitignore`

If `.gitignore` does not exist, create a future-safe base version.

Include:

```gitignore
node_modules/
dist/
coverage/

.env
.env.*
!.env.example

*.log

.DS_Store
Thumbs.db

.vscode/*.log

.idea/
```

Do not ignore:

```text
AGENTS.md
prompts/
docs/
package-lock.json
.env.example
```

If a `.gitignore` already exists, preserve useful existing entries.

---

# 14. Do not initialize the Node project yet unless required

Task 01 owns the actual Node/TypeScript foundation.

Therefore this setup phase should **not** yet run:

```bash
npm init
npm install
npm install typescript
npm install @typesafe-ai/sdk
```

unless the repository already contains a Node project and the user explicitly started one.

Do not create `package.json` merely for setup documentation.

Task 01 will perform the real application foundation work.

---

# 15. Do not install Jev yet

Do not install:

```text
@typesafe-ai/sdk
```

in this setup phase.

Jev integration belongs to Task 02.

Similarly do not create:

```text
src/jev/
src/policy/
src/github/
```

yet unless those folders already exist.

This setup phase is purely repository/process preparation.

---

# 16. VS Code + Codex usage instructions

Add this section to `docs/codex-workflow.md`.

## Recommended workflow

1. Open the **main `jevflow` repository** in VS Code.
2. Open the Codex extension.
3. Make sure Codex has access to the workspace.
4. Verify `AGENTS.md` exists.
5. Put the current phase prompt in `prompts/`.
6. Ask Codex to read:
   - `AGENTS.md`
   - the selected task Markdown
7. Tell Codex to execute that phase only.
8. Review diffs before accepting risky changes.
9. Let Codex run terminal checks.
10. Confirm the final report is factual.

---

## Recommended Codex command for future phases

Use:

```text
Read AGENTS.md first.

Then read the complete task instructions from:
prompts/task-XX-<name>.md

Execute that task only.

Before editing:
- inspect the existing repository,
- inspect git status,
- understand the current architecture.

Implement the task fully.
Run all required validation.
Fix failures introduced by your changes.

Do not implement later phases.

At the end report:
- files changed,
- features implemented,
- validation results,
- test results,
- Git branch,
- commit hash,
- merge status,
- blockers,
- next task.
```

---

# 17. Optional Codex instruction file hierarchy

If Codex supports repository-specific instruction discovery through `AGENTS.md`, use only the root `AGENTS.md` initially.

Do not create multiple nested `AGENTS.md` files unless later modules genuinely require different rules.

One clear root instruction file is easier to maintain for a two-day project.

---

# 18. Setup validation checklist

Before finishing this phase, verify:

```text
[ ] Correct repository is open
[ ] Repository is not jevflow-test-repo
[ ] Git is initialized
[ ] main branch exists
[ ] No user files were deleted
[ ] AGENTS.md exists
[ ] prompts/README.md exists
[ ] docs/roadmap.md exists
[ ] docs/codex-workflow.md exists
[ ] README.md truthfully shows setup-only status
[ ] .gitignore protects secrets
[ ] No API keys exist in tracked files
[ ] No Jev SDK installed
[ ] No application logic implemented
[ ] No Task 01 code implemented
[ ] Git diff reviewed
```

---

# 19. Recommended setup commit

After verifying all setup files:

```bash
git status
git diff --check
git add AGENTS.md README.md .gitignore docs prompts .vscode
git commit -m "chore: prepare JevFlow Codex development workspace"
```

Adapt the staged files to what actually exists.

Do not stage unrelated user files.

Do not create an empty commit.

If the repository has a remote, do not automatically push unless pushing is clearly intended and authentication is already configured.

---

# 20. Final directory target after setup

The repository should look roughly like:

```text
jevflow/
├── .git/
├── .vscode/
│   ├── extensions.json        # optional/minimal
│   └── settings.json          # optional/minimal
├── docs/
│   ├── codex-workflow.md
│   └── roadmap.md
├── prompts/
│   └── README.md
├── AGENTS.md
├── .gitignore
└── README.md
```

Future Task 01 will create the actual application structure.

---

# 21. Acceptance criteria

This setup phase is complete only when all of the following are true:

- [ ] The workspace is confirmed to be the main JevFlow repository.
- [ ] Git is initialized safely.
- [ ] `main` exists.
- [ ] `AGENTS.md` defines Codex-wide project rules.
- [ ] Codex and Jev roles are clearly separated.
- [ ] The seven-phase roadmap is documented.
- [ ] `prompts/README.md` defines prompt execution rules.
- [ ] `docs/roadmap.md` exists.
- [ ] `docs/codex-workflow.md` exists.
- [ ] `.gitignore` prevents accidental secret commits.
- [ ] No API credentials were added.
- [ ] No Jev SDK was installed.
- [ ] No product implementation was started.
- [ ] No Task 01 functionality was implemented.
- [ ] No destructive Git operations were used.
- [ ] Setup files were reviewed.
- [ ] A setup commit was created if safe.
- [ ] Working-tree state is truthfully reported.

---

# 22. Required final report from Codex

At the end, provide a concise factual report containing:

## Setup completed

List:

- files created,
- files modified,
- Git initialization status,
- current branch,
- commit hash if a commit was created,
- whether a remote exists,
- whether the working tree is clean.

## Environment

Report:

```text
VS Code version:
Node.js version:
npm version:
Git version:
```

If a command is unavailable, state that clearly.

## Safety confirmation

Confirm:

- no Jev API calls were made,
- no GitHub API operations were made,
- no API keys were created or exposed,
- no Task 01 implementation was performed.

## Next step

State exactly:

```text
Next: Task 01 — Project Foundation & Configuration (Codex Edition)
```

---

# 23. Stop condition

After the setup phase is complete:

**STOP.**

Do not continue automatically into Task 01.

Do not install project dependencies.

Do not implement JevFlow product logic.

Wait for the Task 01 Codex Edition prompt.

