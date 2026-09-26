# Technical Decisions

## Foundation

- Target Node.js 20 or newer and use npm with a committed lockfile.
- Use one root package with strict TypeScript and NodeNext ESM.
- Use `.js` relative import specifiers so emitted files run directly in Node.js.
- Use `tsx` for local TypeScript execution, Vitest for offline tests, ESLint for static analysis, and Prettier for formatting.
- Keep the Task 01 bootstrap local and network-free. Credentials remain optional.
- Use no database for the MVP foundation.

## Deferred capabilities

- Add real GitHub automation and mutations in Task 04.
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
