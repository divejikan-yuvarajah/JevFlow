# VS Code + Codex Workflow

Use this process for each future JevFlow development phase:

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

For Task 05 and later evaluation work, run fixture mode during normal verification. Never run `--mode live --confirm-live`, even when a key exists, unless the user explicitly authorizes paid live benchmarking in the current session.

## Recommended workflow

1. Open the main `jevflow` repository in VS Code.
2. Open the Codex extension.
3. Make sure Codex has access to the workspace.
4. Verify `AGENTS.md` exists.
5. Put the current phase prompt in `prompts/`.
6. Ask Codex to read `AGENTS.md` and the selected task Markdown.
7. Tell Codex to execute that phase only.
8. Review diffs before accepting risky changes.
9. Let Codex run terminal checks.
10. Confirm the final report is factual.

## Recommended Codex command for future phases

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

## Task 01 example

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

## Phase and repository safety

Use one feature branch per phase. Ensure the previous phase is merged before beginning the next one, then inspect the working tree and preserve any existing work. Do not use destructive Git operations or force push automatically. Review diffs, run the available validation commands, and report the actual commit and merge status.

Keep Codex and Jev roles distinct: Codex supports software development; TypeSafe AI Jev is the runtime inference provider. Never replace Jev with OpenAI API calls.

Keep `jevflow-test-repo` separate from the main `jevflow` source repository. Use the test repository only for explicit GitHub automation testing.
