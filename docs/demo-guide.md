# Demo and Capture Guide

This is a suggested recording plan. No recording, screenshot, live Jev result, or GitHub Actions run is claimed to exist.

## Before recording

```bash
npm run eval -- --mode fixture --format json --output evals/results/demo-offline.json
npm --prefix web run dev
```

Open `http://localhost:3000` and `/evaluation`. Keep the dashboard in **Preview Fixture** mode. Close terminals, tabs, notifications, and environment files that could expose personal information or credentials.

## 60–90 second storyboard

| Time   | Suggested shot and narration                                                                                                                                                                               |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00–10s | Show the JevFlow title. Explain that issue volume makes consistent triage difficult.                                                                                                                       |
| 10–25s | Load **Ordinary backend bug** and point out `SYNTHETIC PREVIEW — not a Jev result`. State that no provider request runs in preview.                                                                        |
| 25–40s | Show issue type, engineering area, priority, security P(YES), and needs-human-review P(YES). Distinguish selected probability from reported confidence.                                                    |
| 40–55s | Show the confidence gate and proposed labels. Load **Possible security escalation** and explain that `security-review` requests human review rather than confirming a vulnerability.                       |
| 55–70s | Open `/evaluation`. Show the `offline-fixture` provenance, denominators, and `Jev provider latency: Not measured`. Explain that the figures validate the synthetic harness and policy only.                |
| 70–90s | Show the workflow diagram and target template because live GitHub integration remains untested. Replace this segment with a real issue and Actions summary only after an authorized run has been observed. |

## Demo scenarios

1. **Ordinary backend bug** — demonstrates a high-confidence synthetic auto path.
2. **Possible security escalation** — demonstrates critical/security safeguards and withheld speculative category labels.
3. **Ambiguous report** — demonstrates conservative human review when evidence is weak.

The authored outputs are examples, not expected live Jev predictions.

## Capture targets

- [ ] Landing page with Preview Fixture provenance visible
- [ ] Issue form with one synthetic sample selected
- [ ] Three typed choice cards with both probability measures
- [ ] P(YES), policy reasons, and proposed-label section
- [ ] Evaluation page with an actual locally generated fixture artifact
- [ ] Desktop viewport (record exact size)
- [ ] Narrow mobile viewport (record exact size)
- [ ] Keyboard focus state
- [ ] Repository tree showing `src/`, `tests/`, `evals/`, `web/`, and workflows
- [ ] Real Actions summary only if an authorized live target run is completed

Store genuine product screenshots under `docs/screenshots/` with descriptive names and capture notes. Do not add a large video to Git by default, synthesize an Actions result, or crop away the synthetic provenance badge.

## Evidence note template

For every screenshot or video segment, record:

- date and local commit SHA;
- page/command and viewport;
- offline fixture or authorized live mode;
- whether provider/GitHub activity occurred;
- any redactions and why.

Current status: **screenshots and browser capture pending**.
