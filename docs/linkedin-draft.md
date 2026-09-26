# LinkedIn Post Draft

Instead of only reading about Jev, I built a small project with it.

JevFlow is a confidence-aware GitHub issue triage MVP. It asks TypeSafe AI Jev for three structured `choice` decisions—issue type, engineering area, and priority—and two binary P(YES) decisions for security sensitivity and human review.

The part I found most useful was keeping inference separate from application policy. JevFlow preserves selected-option probability and reported confidence as different signals. A deterministic gate then escalates weak, critical, ambiguous, or security-sensitive cases and proposes only allowlisted GitHub labels.

I tested the application offline with unit and integration tests plus a 30-case synthetic fixture dataset. Those fixture metrics validate the evaluation harness and policy behavior; they are not claims about live Jev accuracy or latency. The project also includes a local Next.js playground, a guarded GitHub Actions workflow, and deployment instructions for a disposable test repository.

One lesson: uncertainty and repository permissions need explicit product behavior. A confident-looking output should not bypass a weaker decision, and a repository token cannot be assumed to act somewhere else. Conservative human-review fallbacks made those boundaries visible.

Built with TypeScript, Vitest, Next.js, GitHub Actions, and TypeSafe AI Jev. OpenAI Codex assisted with development; Jev remains the runtime inference provider.

Repository: `<PUBLIC_REPOSITORY_URL_PENDING>`

Demo: `<PUBLIC_DEMO_URL_PENDING>`

#TypeScript #GitHubActions #AIEngineering #DeveloperTools

_Draft only. No endorsement by TypeSafe AI or OpenAI is claimed, and this has not been posted._
