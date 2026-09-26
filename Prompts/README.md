# JevFlow development prompts

Each prompt represents one development phase. Execute prompts sequentially and never run multiple phase prompts at once.

Before starting a phase:

- Ensure the previous phase is merged.
- Ensure the working tree is clean, or preserve and account for any existing work.
- Read `AGENTS.md`.
- Inspect the current repository.

Expected prompt filenames:

- `task-01-project-foundation.md`
- `task-02-jev-integration.md`
- `task-03-confidence-policy.md`
- `task-04-github-automation.md`
- `task-05-evaluation.md`
- `task-06-dashboard.md`
- `task-07-release.md`

The supplied Task 01 and Task 02 prompts are available under their expected filenames above. Their original source files remain preserved in `Prompts/`. This setup does not create substitute prompts or execute either task. Add a phase prompt under its expected filename when it is supplied and that phase is ready to be prepared.
