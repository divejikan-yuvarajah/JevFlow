# JevFlow — Connected Repositories Dashboard Enhancement (Codex Edition)

> **Execute this enhancement only in the existing main `jevflow` repository.**  
> Development environment: VS Code + OpenAI Codex extension  
> Recommended branch: `feat/connected-repositories`  
> Prerequisite: Completed Setup + Tasks 01–07, including Task 06 Next.js dashboard and the Coastal Mist light-theme redesign.  
> This is a **post-MVP enhancement**, not a replacement for any of the seven task implementations.  
> OpenAI Codex writes the application code; **TypeSafe AI Jev remains the only runtime inference provider**.

---

## 0. Mission and success criteria

Act as a senior Next.js/TypeScript engineer, GitHub integration engineer, UI/UX designer and security reviewer. Read root `AGENTS.md` and this entire prompt. Inspect the **actual existing repository, code and test commands** before implementation. Execute the changes, run tests/builds, and document the results rather than merely describing what should be done.

Implement a genuinely functional **Connected Repositories** section in JevFlow's existing web dashboard. A user should be able to:

1. Paste a **public GitHub repository URL** (e.g. `https://github.com/OWNER/REPO`) or enter an `owner/repo` identifier.
2. Validate the input and fetch the **real public GitHub repository metadata** through a safe server-side API adapter.
3. See a clearly identified **read-only public repository link**, not a false claim of account authorization or workflow installation.
4. View the repository's **real GitHub issues** with status, labels and metadata, excluding pull requests.
5. Open an issue detail pane and transfer its title/body into the **existing JevFlow playground** for a user-triggered analysis, without automatic paid inference.
6. Optionally inspect whether a JevFlow GitHub Actions workflow can be observed in the target repository and show an honest, limited status. Do not claim that the workflow, secrets or Jev inference are healthy merely because a workflow file exists.
7. Disconnect/remove a locally saved repository without touching GitHub.
8. Continue using the existing offline fixture playground while the TypeSafe key is unavailable.

**This feature is read-only.** Connecting a public repo through the dashboard must NOT install a GitHub App, grant permissions, create issues, apply labels, dispatch workflows, configure secrets, or modify a remote repository. Actual label automation remains the separate Task 04 GitHub Actions path.

Do not introduce login, a database, PAT collection forms, OAuth, GitHub App registration or an additional AI classifier in this MVP enhancement. Private repository access is out of scope until a properly authenticated, per-user GitHub App/OAuth design is approved.

---

## 1. Mandatory preflight and repository safety

Read at least (adapt to real paths):

```text
AGENTS.md
README.md
package.json
package-lock.json
web/package.json
web/package-lock.json (if present)
web/app/ or web/src/app/
web/components/ or actual shared UI paths
web/lib/ or actual server/client module structure
web/tailwind configuration / global CSS / theme tokens
web/.env.example and root .env.example (if present)
docs/architecture.md
docs/development.md
docs/roadmap.md
docs/codex-workflow.md
deploy/target-repo/README.md
existing analyzer / policy / proposed-label mapper
existing playground API route and input / output contracts
Task 05 evaluation report and its rendering component
existing web tests and root tests
```

Perform `pwd`, `git status --short`, `git branch -a`, `git remote -v`, `node -v`, `npm -v`, `npm run check`, and the **actual existing web verification script** where available. Record baseline problems without blaming the new enhancement.

Confirm current directory is the main `jevflow` repository, **not** `jevflow-test-repo`. If wrong, STOP. Protect any uncommitted user files. Do not use `git reset --hard`, `git clean -fd`, a force-push or a silent stash. Do not modify the live disposable repository unless separately authorized. Inspect actual source exports rather than forcing illustrative filenames into an incompatible codebase.

If safe, create or reuse `feat/connected-repositories` from a verified `main`. Only merge after all offline checks pass. No automatic remote push or remote GitHub modification.

---

## 2. GitHub integration contract and deployment truth

There are **three different states**; keep them distinct in UI and source types:

- **Linked for viewing:** JevFlow has verified a public GitHub repository and can fetch public metadata/issues. No GitHub authorization or write access is implied.
- **Workflow observed:** The GitHub workflow API returned a matching workflow with a reported state. This still does not establish that necessary secrets, source reference, permissions or real inference work.
- **Automation verified:** Only say this after an actual, authorized successful end-to-end workflow run has been observed. This enhancement must not manufacture that status or auto-run a workflow. Prefer no third status if there is no verified integration record.

A GitHub Actions workflow must exist in the **target repository's default branch** to react to that repo's `issues.opened` event. A workflow installed only in the main JevFlow source repository does not automatically handle `jevflow-test-repo` issues. Preserve `deploy/target-repo/jevflow-triage.yml` and its existing setup guide. Provide links/instructions, not silent installation.

Use GitHub's documented REST endpoints, verifying installed Octokit version/signatures if reusing an existing GitHub adapter:

- Repository metadata: `GET /repos/{owner}/{repo}`
- Repository issues: `GET /repos/{owner}/{repo}/issues`
- Single issue: `GET /repos/{owner}/{repo}/issues/{issue_number}`
- Optional workflows: `GET /repos/{owner}/{repo}/actions/workflows` or get known workflow filename.

GitHub issue-list responses may include **pull requests**. Filter items with a `pull_request` field. Read-only public endpoints do not require an API key, subject to GitHub rate limits. Prefer per-page limits (e.g. 20 or 30, never above 100), bounded pagination and a predictable timeout. Do not hardcode an unstable API-version header; use documented versioning supported at implementation time.

Authoritative docs:
- https://docs.github.com/en/rest/repos/repos
- https://docs.github.com/en/rest/issues/issues
- https://docs.github.com/en/rest/actions/workflows
- https://nextjs.org/docs/app/getting-started/route-handlers
- https://nextjs.org/docs/app/guides/data-security

---

## 3. Scope and architecture

The existing Task 06 dashboard is the source of truth for layout, root scripts, shared result presentation and guarded live Jev analysis. The existing Task 02/03 core is the source of truth for `analyzeIssue`, the confidence policy and the label mapper. Do not copy their logic into the new repository page.

Suggested structure (adapt to actual project's `app` versus `src/app` choice):

```text
web/
  app/
    repositories/
      page.tsx                       # Connected Repositories page
      [owner]/[repo]/page.tsx        # optional detail route; safe encoded segments
    api/
      repositories/
        resolve/route.ts            # public metadata lookup
        issues/route.ts             # bounded read-only list
        issue/route.ts              # bounded read-only detail
        workflow-status/route.ts    # optional read-only observed workflow status
  components/repositories/
    ConnectRepositoryForm.tsx
    RepositoryCard.tsx
    RepositoryIssueList.tsx
    RepositoryIssueDetail.tsx
    RepositoryWorkflowStatus.tsx     # if implemented
    RepositoryEmptyState.tsx
  lib/github/
    parseRepositoryInput.ts        # pure strict owner/repo parser
    publicGithubClient.ts          # server-only, narrow, injectible GitHub REST reader
    repositoryTypes.ts             # safe client-facing DTOs
    repositoryMapper.ts            # explicit API → safe DTO conversion
  lib/repositories/
    linkedRepositories.ts          # local-only, versioned public repo preferences
  tests/...                        # use actual test layout

docs/connected-repositories.md
```

Prefer an existing client or component abstraction when one is already present. No separate Express backend, no new database, no broad monorepo redesign, and no parallel inference endpoint. Keep `web` build and the root core build independently functional. Only add dependencies after inspecting what is installed, and choose versions compatible with the project's actual Node/Next version.

---

## 4. Strict public-repository input validation

Support these input examples:

```text
https://github.com/OWNER/REPO
https://github.com/OWNER/REPO/
OWNER/REPO
```

Optionally accept one `.git` suffix if it is deliberately handled and tested. Reject arbitrary hostnames, schemes, ports, user info, querystrings/fragments (unless intentionally and safely normalized), deep paths such as `/issues/5`, empty segments, path traversal, backslashes, encoded separators, newline/control characters, suspicious lookalike domains and repository names outside GitHub's expected syntax. Normalise to a canonical `{ owner, repo, fullName, url }` object.

**SSRF safety:** Never `fetch()` an arbitrary URL pasted by the user. After parsing and validating path segments, construct requests against the **fixed** `https://api.github.com` origin using the official API/Octokit. Bound input length and page numbers. Re-check the parsed owner/repo in server routes independently of client validation. No raw input interpolation into a shell, HTML or external destination.

A `404` may mean not found, private or inaccessible; communicate it without claiming the repository definitely does not exist. Return suitable sanitized outcomes for missing/disabled issues, rate limiting (`403`/`429`, `Retry-After` or remaining-reset hints where safe), transient network errors, invalid URL, malformed data and API timeouts.

---

## 5. Server-side GitHub read adapter and API routes

Implement a small **server-only** GitHub reader using existing Octokit if appropriate, or carefully scoped native `fetch`. Use `import 'server-only'` where compatible to prevent accidental client bundling.

For the initial implementation, support **public repositories only** and use unauthenticated public read endpoints. Do not introduce user-supplied PATs or expose a server token in the UI. If a global server token already exists for Task 04, DO NOT automatically reuse it for an arbitrary user-entered repository; this could unintentionally expose private data. Keep the public repository reader isolated from existing issue-write credentials. Verify `private === false` before exposing DTOs to browser code.

Implement routes that:

- validate every parameter on the server;
- use HTTP GET/POST appropriately for actual request semantics; avoid a route that issues GitHub writes;
- expose only whitelisted DTOs, never raw GitHub headers/tokens or irrelevant account data;
- return `{ data, source: 'github-public-api' }` or a typed sanitized error shape;
- have a controlled timeout, page/perPage upper bounds and sensible revalidation/cache policy so refreshed issues can be seen;
- handle body `null` as empty string, but bound the issue body before sending to UI or analysis;
- filter all `pull_request` items and do not treat the presence of a PR as a real issue;
- avoid unsafe Markdown rendering and `dangerouslySetInnerHTML` on issue text;
- do not call the TypeSafe SDK when fetching repo metadata/issues.

Suggested safe DTOs:

```ts
type PublicRepository = {
  fullName: string;
  owner: string;
  repo: string;
  htmlUrl: string;
  description: string | null;
  defaultBranch: string;
  openIssuesCount?: number; // GitHub metadata counts may include PRs; label accurately
  hasIssues: boolean;
  visibility: 'public';
  fetchedAt: string;
};

type PublicIssueSummary = {
  number: number;
  title: string;
  state: 'open' | 'closed';
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  labels: readonly { name: string; color?: string }[];
  authorLogin?: string;
  bodyPreview: string;
};

// Explicit issue detail type may add bounded body, but no raw remote API object.
```

Use actual GitHub API semantics for issue filters, ordering, `state` and pagination. Do not claim GitHub's `open_issues_count` is a precise count of issues excluding PRs. Show list-level actual returned issue counts with accurate scope (e.g. `20 loaded`, not `all issues`).

---

## 6. Connection persistence and disconnect

For this MVP, store **only the validated public owner/repo identifier and basic UI preference** locally in browser storage if needed. Use a versioned small schema, cap the maximum linked repos (e.g. 5), deduplicate case-insensitively, and handle corrupt/unavailable browser storage without crashing. Do not store tokens, issue bodies, API responses, full evaluation artifacts or private repo data in localStorage.

A repository is shown as `Linked for viewing (read-only)` only after a successful real public metadata fetch. If offline/unavailable, show `Previously linked — unable to refresh` rather than claiming a current connection. Provide a visible `Disconnect` action that removes the local reference only, with an honest confirmation such as “Removed from this browser; no GitHub settings were changed.” There is no cloud account sync or organization-wide installation in this version.

Provide an optional quick-start card for `jevflow-test-repo` **without hardcoding a specific owner's identity**. Do not invent its URL or pretend it exists online. Let the user paste the actual URL after pushing the sample repository.

---

## 7. Required UI and interactions — Coastal Mist theme

Maintain the previously requested **premium light background** and muted, neutral identity. Reuse existing tokens; avoid creating a duplicate theme system:

```text
Page background #F7F8F5
Card surface #FFFFFF
Primary accent #386E68
Soft sage #DCEAE5
Muted lavender #A9B7D7
Primary text #263630
Secondary text #64736B
```

If existing CSS variables adjust these slightly for contrast, preserve their accessibility. Typography: use the existing Plus Jakarta Sans / DM Sans / IBM Plex Mono setup if it is present. Avoid dark-dashboard styling, neon, heavy gradients, decorative glass effects and unrelated UI overhaul.

Add `Repositories` to existing navigation without breaking active route, mobile menu or dashboard links.

### Page layout

**A. Header:** `Connected Repositories` with short subtitle, `Read-only GitHub connection` badge and a clear `Connect repository` control.

**B. Connection form:** GitHub URL / owner/repo input, inline validation, loading feedback, example format, sanitized error, disable while request is in progress.

**C. Linked repository cards:** canonical full name, description, open on GitHub link, read-only status, issues enabled/disabled, last refresh, `View issues`, `Refresh`, and `Disconnect` actions. Never show fake owner or fake issue counts.

**D. Issue list:** real current issues, status/labels, date, accessible loading and empty states, open/closed filter, small client-side search over fetched page, explicit pagination/load-more where supported. Filter PRs. Mark data as fetched from public GitHub API.

**E. Issue details:** selected issue title, description (safe plain text or sanitized Markdown), state, labels, GitHub link, and `Open in JevFlow Playground` action.

**F. Workflow status (optional but useful):** on an explicit click (or well-bounded fetch), check whether a JevFlow workflow is observable. Say `Workflow found`, `Not found`, `Access/rate limit prevents verification`, or `Not checked`, with actual reported GitHub state if available. Do NOT say `Fully connected`, `Automation healthy`, `TypeSafe key configured`, or `Live triage verified` from mere workflow presence. Provide a link to `docs/connected-repositories.md` / existing target-workflow install instructions.

Use accessible focus states, keyboard navigation, responsive mobile/desktop layouts, semantic buttons/links, and reduced-motion-aware transitions. Reuse existing UI components where possible.

---

## 8. Open a GitHub issue in the existing playground — no fake inference

When the user clicks `Open in JevFlow Playground`:

1. Use the validated, bounded selected issue title and body as **form input only**.
2. Prefer the existing playground's supported state-sharing pattern. If no pattern exists, use a small client-only navigation store/sessionStorage handoff with a size limit and clear-on-use behavior, or a narrowly typed client context. Avoid putting the full issue body in URL query parameters or permanent localStorage.
3. Display provenance: `Imported from a public GitHub issue: OWNER/REPO#NUMBER` and a link to the original issue.
4. Do NOT automatically call Jev on navigation or page load. The user must explicitly click the pre-existing live Analyze action, which remains disabled/gated while `TYPESAFE_API_KEY` is unavailable.
5. Offline fixture preview must remain an explicit separate action using documented synthetic fixtures; **never choose a fixture that happens to resemble imported text and present it as analysis of the imported issue**.
6. Preserve the Task 02/03 semantics in the result view: selected-option probability, separate SDK-reported confidence, and binary P(YES) are distinct.
7. The dashboard must never apply remote labels as a side effect of this handoff.

If the existing web app architecture makes issue handoff unsafe/incompatible, implement a simpler `Copy issue details` or manually prefill form mechanism, document the limitation, and do not break existing analysis.

---

## 9. Security and operational safeguards

Mandatory:

- Public read-only only; no user token entry, no global PAT leakage or private repository browsing.
- Fixed API origin and strictly validated owner/repo prevent arbitrary URL SSRF.
- Never render untrusted GitHub issue bodies as raw HTML; sanitize Markdown if rendering it.
- No secrets in browser bundle, network responses, localStorage, logs or screenshots.
- Bounded input, timeouts, API pagination, rate-limit UX and retry without infinite loops.
- API routes must not allow arbitrary authenticated GitHub mutation through forged query parameters.
- Do not claim read-only linking grants installation/permissions. Do not claim workflow presence is proof of API key or successful automation.
- Preserve existing Task 04 `GITHUB_TOKEN` use in GitHub Actions without changing its repo scope.
- Preserve existing Task 06 guarded live Jev endpoint; imported issue data is untrusted.
- Never access remote repositories on behalf of the user outside intentionally requested **public read** checks. No issue creation, comments, label writes, workflow dispatch or remote push in this task.
- Public-facing deployments can see public GitHub data. If adding server credentials later, introduce real per-user authentication and scoped authorization first; don't reuse shared server credentials to expose private data.

---

## 10. Meaningful offline tests (must work without GitHub/TypeSafe keys)

Use the existing web test framework and injected fake GitHub adapter. Tests must not depend on actual GitHub availability.

At minimum cover:

**URL parser:** valid URL/slug, trailing slash, case differences, `.git` if supported; reject lookalike host, nested path, query injection, wrong protocol, credentials in URL, malformed owner/repo, path traversal, encoded slash, overly long input.

**Public metadata adapter:** maps only approved fields; non-public response is refused; issues-disabled response handled; private existing server token never leaks into public results.

**Issue list:** filters `pull_request` entries; respects state/page/perPage caps; handles empty page, `body:null`, markdown/untrusted text, bounded previews and labels; correct next-page behavior.

**Error cases:** 404/private-or-inaccessible, rate limit, 403, 429, 5xx, timeout, invalid JSON/schema, repository renamed/unavailable and network offline. Show helpful sanitized UI state.

**Linked preferences:** deduplication, cap, corrupt storage, refresh failure, disconnect only removes local link; never stores secrets or bodies.

**UI:** form validation, loading/success/error states, responsive layout/navigation, issue filters, empty state, no false “workflow verified” badge.

**Playground handoff:** imported issue becomes form input; no live Jev call on navigation; no fake fixture presented as real issue analysis; no GitHub writes; no raw issue text in URL.

**Regression:** core `npm run check`, existing Task 04 mocked GitHub automation and Task 05 evaluation, original dashboard preview/live gating, and independent web build remain working.

Use example synthetic issues in tests with clearly authored fixture provenance; never attribute them to a real GitHub repo. Unit/integration tests must not use paid Jev calls.

---

## 11. Optional real public-repository read smoke test

After completing all offline tests, a **read-only** manual test is appropriate if the user has explicitly entered a real public URL via dashboard. It should:

1. Open the dashboard locally.
2. Paste the user's actual public `jevflow-test-repo` URL (do not guess the owner).
3. Click Connect and verify a real GitHub metadata response.
4. View actual public issues and confirm PRs are excluded.
5. Open an issue, check real source URL/labels, and prefill the existing playground.
6. Verify no Jev call occurs until the user explicitly requests it.
7. Disconnect locally and verify no GitHub state was changed.

No real Jev key is required to read a public GitHub repository. However, unauthenticated GitHub API use has rate limits; present a bounded, human-readable rate-limit state. If the user has not provided/entered a real URL, record `NOT RUN — public repo URL not available`. Do not invent a repo owner, issue count or live success.

Do not seed the 15 sample issues as part of this enhancement. That is a separate explicit action and may trigger live workflows if installed.

---

## 12. Documentation

Add `docs/connected-repositories.md` and update relevant existing README/development/architecture/roadmap pages with **accurate implemented status**. Document:

- What `Connect` means: a validated local read-only link to a public repo, not OAuth or GitHub App installation.
- How to push `jevflow-test-repo` to GitHub if not already public (reference existing testing-repo guide; do not create/push it automatically).
- How to paste `https://github.com/OWNER/jevflow-test-repo` with the user's actual owner.
- Public metadata/issue reading and exclusions (PRs).
- GitHub API rate-limit/availability limitations and local storage behavior.
- Issue-to-playground flow with explicit live Jev gating while TypeSafe is waitlisted.
- Existing `deploy/target-repo` workflow installation remains separate and requires target Actions configuration/secret to make actual automatic triage work.
- How to interpret workflow status if implemented: observed only, not end-to-end proof.
- Private repo/OAuth/GitHub App as a **future enhancement**, not an unimplemented checkbox or fake current feature.

Update the project's seven-phase roadmap truthfully as a **post-release enhancement**. Do not rewrite earlier Tasks 01–07 as incomplete merely because a new feature exists. Preserve the current light design and release docs.

---

## 13. Execution and validation commands

1. Preflight actual code, existing architecture, Git and baseline checks.
2. Create/reuse `feat/connected-repositories` safely.
3. Implement canonical parser, safe DTO mapper and injected server-only GitHub reader.
4. Add server routes and error/rate-limit handling.
5. Add local public-repo link persistence and the responsive connected-repos page.
6. Implement issue list/detail and existing-playground handoff without automatic inference.
7. Add optional honest workflow observation, if feasible without overengineering.
8. Add full offline tests, documentation and nav integration.
9. Run relevant validation; fix failures introduced by this change.
10. Review diff, staged files and secrets; commit and merge only if safe. STOP.

Use existing scripts, with names adapted only after actual inspection:

```bash
npm run format:check
npm run typecheck
npm run lint
npm test
npm run build
npm run check

npm --prefix web run typecheck
npm --prefix web run lint
npm --prefix web test
npm --prefix web run build
npm --prefix web run check

git diff --check
git status --short
git diff --stat
```

If a script doesn't exist, use the equivalent actual project command and report the difference. Do not pretend an absent script passed. Verify browser layout manually if browser tooling is available; otherwise report `NOT RUN`. Do not trigger the paid `smoke:jev` or GitHub write runner to validate a public-repo read feature.

Suggested commit:

```text
feat: add read-only connected GitHub repositories dashboard
```

If the repo is safe and checks pass, intended sequence:

```bash
git add <only reviewed enhancement files>
git diff --cached --check
git commit -m "feat: add read-only connected GitHub repositories dashboard"
git switch main
git merge --no-ff feat/connected-repositories
npm run check
npm --prefix web run check
git status --short
```

No force-push, no unrelated remote repository mutation, no misleading CI/deployment/live-test claims.

---

## 14. Mandatory acceptance criteria

- [ ] Existing JevFlow Tasks 01–07 and Coastal Mist visual identity preserved.
- [ ] User can link an actual **public** GitHub repository via URL or `owner/repo`, after real metadata verification.
- [ ] Link status is explicitly `read-only`, not falsely OAuth/GitHub App-installed.
- [ ] Strict GitHub URL parsing, fixed API origin, server-only reader and safe bounded DTOs.
- [ ] Actual public issues load; pull requests excluded; filters/pagination and honest rate-limit/error states work.
- [ ] Selected issue detail safely fills the existing playground without automatically calling Jev or writing GitHub labels.
- [ ] No fixture output is misrepresented as real Jev analysis of imported issue text.
- [ ] Local links can be refreshed/disconnected without any GitHub mutation or secret storage.
- [ ] Optional workflow status means only observable workflow state, not verified runtime/secret status.
- [ ] No real Jev access required for public repository browsing.
- [ ] Offline tests mock GitHub and Jev; root/web validation and independent builds pass.
- [ ] Light theme, typography, accessibility and mobile UI preserved.
- [ ] Documentation explains read-only linking vs separate Task 04 Actions installation.
- [ ] Secrets, test repo and existing GitHub workflows preserved.
- [ ] Git branch, commit, merge and live-read verification reported factually.

---

## 15. Final factual Codex report

Return a concise report with:

```text
JevFlow — Connected Repositories Enhancement Report

Workspace and baseline: ...
Branch: feat/connected-repositories

Implemented:
- URL parser/server adapter/routes
- Connected Repositories UI and nav
- Real issue list/details/pagination
- Existing playground handoff and live gating
- Optional workflow observed status (if implemented)
- Local-only persistence/disconnect
- Docs and tests

Security:
- Public read-only scope and private-response rejection
- SSRF prevention/fixed GitHub API host
- No shared token or TypeSafe key leakage
- No automatic Jev call or GitHub write

Observed validation:
- Root: format/typecheck/lint/tests/build/check ...
- Web: typecheck/lint/tests/build/check ...
- Browser smoke ... PASS / FAIL / NOT RUN (reason)
- Actual public-repo read ... PASS with real URL / NOT RUN (reason)
- Paid Jev integration ... NOT RUN (unless separately authorized)
- git diff --check ...

Files changed: ...
Commit: actual hash or blocker
Merge to main: YES / NO (factual reason)
Working tree: CLEAN / DIRTY
Push/deploy/remote issue mutation: NOT PERFORMED unless explicitly authorized and verified
Remaining limitations: public only; local links; workflow status not equivalent to working automation; real Jev pending key.
```

**EXECUTE THIS POST-MVP ENHANCEMENT ONLY. STOP. Do not expand into GitHub OAuth, a GitHub App, private repo access, database-backed multi-user SaaS or actual issue mutation from the dashboard.**
