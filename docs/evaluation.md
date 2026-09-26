# Evaluation and benchmarking

JevFlow's evaluation harness has two distinct modes. `offline-fixture` is deterministic, network-free, and uses authored normalized decisions. `live-jev` invokes the existing TypeSafe AI Jev analyzer only after an explicit CLI confirmation and configured key. Standard tests, CI, imports, bootstrap, and `npm run check` use no live inference.

## Dataset and annotations

Dataset version `2026.09.1` contains 30 ordered synthetic cases. It covers backend, frontend, database, DevOps, AI/RAG, agent actions, security handling, documentation, questions, maintenance, ambiguity, Unicode, multiline text, and an empty body. Expected categories, security relevance, and review need are human annotations under [the committed rubric](../evals/annotation-guide.md). They are not production incidents or objective provider truth.

Each area can optionally name explicit acceptable alternatives. Strict area accuracy always compares against the primary annotation; acceptable-answer accuracy additionally credits only those declared alternatives.

The expected-annotation distribution is:

| Dimension        | Counts                                                                   |
| ---------------- | ------------------------------------------------------------------------ |
| Issue type       | bug 15, feature 6, question 4, maintenance 3, documentation 2            |
| Engineering area | general 8, DevOps 5, backend 4, frontend 4, AI 3, database 3, security 3 |
| Priority         | medium 12, high 8, low 7, critical 3                                     |
| Review cohorts   | needs human review 13, security-sensitive 5, ambiguity-tagged 5          |

Categories overlap with scenario tags; cohort counts are not intended to be statistically representative of public GitHub issues.

## Accounting and classification

Every selected record produces either a success or a sanitized failure. The invariant is:

```text
total = succeeded + failed + skipped
```

The current runner does not skip records, so `skipped` is zero. Completion rate is `succeeded / total`. Classification denominators contain successfully evaluated cases only:

```text
strict accuracy = exact primary-category matches / successful cases
acceptable area accuracy = primary-or-declared-alternative matches / successful cases
exact all-three accuracy = records matching type, primary area and priority / successful cases
```

Reports include confusion counts. Failed records remain visible in run accounting and never improve classification accuracy by entering the numerator.

## Policy and review metrics

- Automation coverage is policy mode `auto` divided by successful cases. It is simulated policy output, not confirmed GitHub label execution.
- Automated subset classification accuracy is exact all-three matches among `auto` cases divided by `auto` cases.
- Review-required capture is annotated `needsHumanReview: true` cases routed to `review-suggested` or `human-review`, divided by successfully evaluated annotated-review cases.
- Strict human-review rate uses only `human-review` as the numerator for that cohort.
- False-auto count is annotated-review cases routed to `auto`.
- Security review requested rate and security human-review rate use successfully evaluated `securitySensitive: true` annotations as their denominator.

These annotations are subjective engineering judgments. The security metrics do not measure confirmed vulnerability detection.

## Probability and confidence

For each choice dimension, reports calculate average, median, and nearest-rank p95 separately for selected-option probability and provider-reported confidence. Security and needs-review P(YES) are separate binary decision values and are also split by annotated yes/no cohort in JSON.

The exploratory gate-score table uses `[0.00, 0.75)`, `[0.75, 0.90)`, and `[0.90, 1.00]`. It reports observed exact-category correctness in a very small sample and is not a calibration or reliability guarantee. Zero denominators serialize as `null` and render as `N/A`.

## Latency

Offline reports measure only local evaluator processing duration. They state `Jev provider latency: N/A`; the fixtures' required `meta.latencyMs` value is zero and excluded from metrics.

Live reports use successful normalized `meta.latencyMs` values and report average, median, and nearest-rank p95. Each record invokes `analyzeIssue` once at application level, although the SDK transport can retry eligible HTTP failures. Failed calls are not silently mixed into successful inference latency.

## Running evaluations

```bash
npm run eval -- --mode fixture
npm run eval -- --mode fixture --format json
npm run eval -- --mode fixture --format json --output evals/results/<unique-name>.json
```

The live path may issue up to 30 paid requests, runs sequentially, and never falls back to fixtures:

```bash
npm run eval -- --mode live --confirm-live --limit 1
```

Live mode requires `TYPESAFE_API_KEY`. The CLI does not load local `.env` configuration until the live confirmation gate has passed. Start with a limit of one to three only after explicit authorization. It does not use Octokit, request a GitHub token, or apply labels. Generated reports omit raw issue title/body, raw provider errors, SDK responses, and secrets.

## Interpretation limits

Thirty synthetic examples cannot establish production accuracy, safety, latency, cost, or calibration. Authored fixture metrics primarily prove evaluator arithmetic, policy integration, report behavior, and regression coverage. Model behavior can change between authorized live runs. A larger independently reviewed evaluation is required before making performance claims.

## Task 07 reproducibility snapshot

The final offline QA run used dataset `2026.09.1` and wrote ignored artifacts to:

- `evals/results/task07-offline-20260927.json`
- `evals/results/task07-offline-20260927.md`

All 30 fixture cases succeeded with zero failures or skips. The authored normalized fixtures produced 29/30 strict issue-type matches, 26/30 strict area matches, 29/30 acceptable-area matches, 27/30 priority matches, and 23/30 exact all-three matches. The policy routed 12/30 to `auto`, captured 13/13 annotated review-required cases outside `auto`, and recorded zero false-auto cases in that annotated cohort.

These values are a reproducibility snapshot of committed synthetic inputs and authored decisions. They are not observed Jev accuracy, provider latency, or production performance. The JSON report records provider `synthetic-fixture`, mode `offline-fixture`, and no provider-latency distribution. Generated artifacts remain ignored so a fresh clone's dashboard correctly shows an empty state until the user creates a local report.
