# JevFlow evaluation assets

This directory contains the versioned, human-authored synthetic inputs used by the Task 05 evaluation harness. No record describes a real incident, person, organization, repository, credential, or Jev observation.

## Layout

- `dataset/github-issues.json` uses schema `1.0`, dataset version `2026.09.1`, and contains exactly 30 ordered records (`JF-001` through `JF-030`).
- `fixtures/normalized-decisions.json` contains one authored normalized-decision fixture for every record in the same order. The loader expands each compact choice into a complete canonical probability distribution.
- `results/` stores generated local JSON and Markdown reports. Reports are ignored by Git except for `.gitkeep`.
- `annotation-guide.md` defines the annotation rubric and revision process.

The separate disposable test repository was not available as a local source during creation. These cases are original synthetic examples with comparable backend, frontend, database, DevOps, AI, security, documentation, maintenance, question, ambiguity, Unicode, multiline, and empty-body coverage. They are not presented as imported external fixtures.

## Safe commands

```bash
npm run eval -- --help
npm run eval -- --mode fixture
npm run eval -- --mode fixture --format json
npm run eval -- --mode fixture --format json --output evals/results/<unique-name>.json
```

Fixture mode is the default, requires no key, and never initializes the real provider. Generated metrics describe the deterministic fixture harness and existing policy behavior. They are not Jev accuracy, latency, cost, or calibration measurements.

Live mode is separate and deliberately gated:

```bash
npm run eval -- --mode live --confirm-live --limit 1
```

It requires `TYPESAFE_API_KEY`, invokes the existing `analyzeIssue` sequentially, and may incur provider charges. Do not run it without explicit authorization. It never needs a GitHub token and never mutates GitHub.

## Editing and review rules

1. Keep existing IDs and annotations stable. Add a new dataset version when meaning changes.
2. Follow the annotation guide before changing an expected category, boolean, alternative, or rationale.
3. Keep records fictional and free of credential-shaped strings and private issue links.
4. Update dataset and fixtures together; one-to-one ordered coverage is enforced.
5. Preserve deliberate uncertainty and errors in fixtures. Do not tune fixtures to make every metric perfect.
6. Run `npm run check` and an offline fixture evaluation after every change.
7. Record material annotation revisions in the pull request or commit explanation; do not silently rewrite historical expectations.
