# Technical Decisions

## Foundation

- Target Node.js 20 or newer and use npm with a committed lockfile.
- Use one root package with strict TypeScript and NodeNext ESM.
- Use `.js` relative import specifiers so emitted files run directly in Node.js.
- Use `tsx` for local TypeScript execution, Vitest for offline tests, ESLint for static analysis, and Prettier for formatting.
- Keep the Task 01 bootstrap local and network-free. Credentials remain optional.
- Use no database for the MVP foundation.

## Deferred capabilities

- Inspect and integrate the real TypeSafe AI Jev SDK in Task 02; do not invent its transport schema in advance.
- Add deterministic confidence policy in Task 03.
- Add real GitHub automation and mutations in Task 04.
- Consider the optional Next.js presentation layer in Task 06.

OpenAI Codex supports development only. TypeSafe AI Jev will be JevFlow's runtime inference provider.
