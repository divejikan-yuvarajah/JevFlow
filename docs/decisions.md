# Technical Decisions

## Foundation

- Target Node.js 20 or newer and use npm with a committed lockfile.
- Use one root package with strict TypeScript and NodeNext ESM.
- Use `.js` relative import specifiers so emitted files run directly in Node.js.
- Use `tsx` for local TypeScript execution, Vitest for offline tests, ESLint for static analysis, and Prettier for formatting.
- Keep the Task 01 bootstrap local and network-free. Credentials remain optional.
- Use no database for the MVP foundation.

## Deferred capabilities

- Consider the optional Next.js presentation layer in Task 06.

OpenAI Codex supports development only. TypeSafe AI Jev is JevFlow's runtime inference provider.

## Jev integration

- Use the official `@typesafe-ai/sdk` and its typed `TypeSafeClient.systemOne` API.
- Send three `choice` questions and two `noul` questions in one application-level request.
- Keep choice selected probability separate from the SDK's reported choice confidence.
- Treat each `noul` value as P(YES), including valid zero and one boundaries.
- Validate every provider response at runtime and return sanitized typed failures instead of guessed defaults.
- Instantiate the SDK client only for a real request, keep SDK logging off, and bound its timeout and retries.
- Keep policy out of the analyzer. The pure policy layer interprets confidence and P(YES) values deterministically.

## Confidence policy and label proposals

- Each choice score is `min(selectedProbability, confidence)`. The overall gate is the minimum issue type, engineering area, and priority score; averages cannot conceal one weak classification.
- Scores at or above `AUTO_THRESHOLD` use provisional `auto`; scores below auto but at or above `REVIEW_THRESHOLD` use `review-suggested`; lower scores use `human-review`. Comparisons are inclusive and unrounded.
- Critical priority forces human review. Security P(YES) at least `0.50` forces human review and requests `security-review`; human-review P(YES) at least `0.50` also forces human review.
- Either P(YES) from `0.35` through below `0.50`, or truncated input, requires at least review-suggested. These are application policy values, not TypeSafe AI calibration guarantees.
- `security-review` means human security review is warranted; it does not assert that a vulnerability exists.
- Stable reason codes are: `choice_auto_threshold_met`, `choice_review_threshold_met`, `choice_below_review_threshold`, `critical_priority_manual_review`, `security_probability_manual_review`, `human_review_probability_manual_review`, `security_probability_caution`, `human_review_probability_caution`, and `input_truncated_review_suggested`.
- Labels come only from static category and mode maps. Human-review plans receive no speculative category labels, and Task 03 never applies labels through GitHub.

## GitHub automation

- Trust the workflow's `GITHUB_REPOSITORY` and a matching, validated event identity. Manual dispatch fetches the current issue by a validated positive integer and rejects pull requests.
- Read event payloads only from a bounded `GITHUB_EVENT_PATH`. Issue text and inference output are data and never enter shell commands, action references, concurrency keys, or file paths.
- Give the GitHub adapter a narrow injected interface. The Actions token is repository-scoped and workflows explicitly request only `contents: read` and `issues: write`.
- Manage only exact names in the static catalog. Preserve unrelated labels and similar prefixes, never replace the entire label set, and add desired labels before removing stale labels.
- Treat `security-review` as sticky because only a human should clear the request. A normal later run may update other managed labels without removing it.
- On provider, normalization, or policy failure for a trusted issue, use a distinct human-review fallback. Preserve categories and security labels, remove only stale automatic/review markers, and never fabricate probabilities.
- Keep summaries short and sanitized. They report normalized decisions and actual API operations, while excluding raw issue bodies and provider errors.
- Keep source and target repository workflows separate. Issue workflows must exist on the receiving repository's default branch, and its automatic token acts only in that repository.
- Defer issue-facing bot comments. The Actions job summary is the Task 04 report surface and avoids comment ownership and duplication risk.
