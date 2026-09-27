# Connected Repositories

The dashboard's `/repositories` page links public GitHub repositories for read-only inspection. **Connect** means JevFlow validates a repository name, verifies its public metadata through GitHub's public REST API, and saves the canonical `owner/repo` identifier in that browser. It does not install a GitHub App, authorize OAuth, store a token, or grant JevFlow access to the repository.

## Link a public repository

Start the dashboard and open `http://localhost:3000/repositories`:

```powershell
npm --prefix web run dev
```

Enter either `OWNER/REPOSITORY` or `https://github.com/OWNER/REPOSITORY`. For the separate test repository, replace `OWNER` with the actual GitHub account or organization:

```text
https://github.com/OWNER/jevflow-test-repo
```

If that repository has not been published, follow [the test repository guide](../deploy/target-repo/README.md) to prepare it and push it manually. JevFlow does not create or push repositories.

The input parser accepts only an HTTPS `github.com` repository URL or the two-segment shorthand. It rejects credentials, ports, query strings, fragments, additional path segments, encoded separators, control characters, and non-GitHub hosts. The server then calls the fixed `https://api.github.com` origin and refuses private repository responses.

## Data displayed

The page reads and displays bounded public metadata, issue summaries, labels, and a selected issue's detail. GitHub's issues endpoint also returns pull requests, so the server removes every item containing a `pull_request` field. State filtering is sent to GitHub; text and label search applies to the currently loaded issue pages. Use **Load more** for bounded pagination.

Repository identifiers are stored in browser `localStorage`, up to five entries. Issue text is not persisted there. Selecting **Disconnect** removes only the local identifier and performs no GitHub request. Refresh revalidates the public metadata. A corrupt or obsolete local value is ignored.

Unauthenticated GitHub API requests have lower rate limits and may be unavailable temporarily. JevFlow reports not-found, rate-limit, timeout, unavailable, and invalid-response states without exposing upstream response bodies. It sends no GitHub authorization header and does not read `GITHUB_TOKEN`.

## Open an issue in the playground

**Open in JevFlow Playground** places a bounded title, body, source URL, repository name, and issue number in `sessionStorage`, then navigates to the existing playground. The playground consumes and deletes that one-time handoff, shows its source, and lets the user review or edit the text.

This handoff does not run inference. While TypeSafe AI access is unavailable, imported issues remain prefilled with live submission disabled. Synthetic preview fixtures cannot be applied to imported text and are never presented as a Jev result. If local live mode is deliberately enabled later, submitting the reviewed issue remains a separate explicit action governed by the existing server-only Jev gate.

## Automation remains separate

Read-only linking does not label issues or install automation. Actual issue-event triage uses the reviewed Task 04 workflow under `deploy/target-repo/`. Installing it requires copying the workflow to the target repository's default branch, pinning the source revision, configuring the target repository secret, and reviewing Actions permissions. See [deployment](deployment.md) and the [target install guide](../deploy/target-repo/README.md).

The dashboard does not claim that the workflow is installed or healthy. It does not inspect secrets and cannot prove end-to-end inference from public repository data.

## Current limits

- Public repositories only; private repository access is rejected.
- No GitHub OAuth, GitHub App, personal access token, or database.
- Up to five browser-local links and 30 issues per fetched page.
- Public API reads can be rate limited; no authenticated fallback is attempted.
- Workflow observation is not implemented.
- Private repository and account-based access are possible future enhancements and require a separate security design.

Tests use injected fetch adapters and deterministic responses. Normal root and web checks make no GitHub or Jev request. A real public-read smoke test should use a repository URL supplied by the user; no such test is inferred from a guessed repository.
