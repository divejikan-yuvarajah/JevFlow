# Technical Decisions

## Foundation

- Target Node.js 20 or newer and use npm with a committed lockfile.
- Use one root package with strict TypeScript and NodeNext ESM.
- Use `.js` relative import specifiers so emitted files run directly in Node.js.
- Use `tsx` for local TypeScript execution, Vitest for offline tests, ESLint for static analysis, and Prettier for formatting.
- Keep the Task 01 bootstrap local and network-free. Credentials remain optional.
- Use no database for the MVP foundation.

## Deferred capabilities

- Add deterministic confidence policy in Task 03.
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
- Keep policy out of the analyzer. Task 03 will interpret confidence and P(YES) values deterministically.
