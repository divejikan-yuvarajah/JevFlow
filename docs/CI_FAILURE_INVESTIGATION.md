# CI Failure Investigation

## Investigation record

| Item               | Value                                                      |
| ------------------ | ---------------------------------------------------------- |
| Date               | 2026-09-27 to 2026-09-28                                   |
| Repository         | `divejikan-yuvarajah/JevFlow`                              |
| Repair branch      | `fix/ci-workflows`                                         |
| Base commit        | `1b98fa81ab3232ad1c9c49060aae89536f7d9cd1` (`origin/main`) |
| GitHub runner      | Ubuntu 24.04, Node.js 20.20.2, npm 10.8.2                  |
| Local reproduction | Windows, portable Node.js 20.20.2 and npm 10.8.2           |

OpenAI Codex performed this investigation as the development assistant. TypeSafe AI Jev remains JevFlow's inference provider. No live Jev request or GitHub issue mutation occurred.

## Remote evidence

GitHub CLI 2.101.0 inspected the real workflow runs and failed logs using the repository owner's existing Git credential. Historic failed runs remain failed.

| Run / commit                                                                                       | Event and branch                                | Job     | Earliest failing step      | Evidence                                                                              |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------- | -------------------------- | ------------------------------------------------------------------------------------- |
| [36334552699](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36334552699) / `1b98fa8` | Push to `main`                                  | `check` | None                       | Job completed successfully, including root `npm ci` and `npm run check`.              |
| [36334552699](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36334552699) / `1b98fa8` | Push to `main`                                  | `web`   | `Install web dependencies` | npm 10.8.2 rejected `web/package-lock.json` as out of sync.                           |
| [36333751792](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36333751792) / `cc9c5e9` | Pull request from `feat/connected-repositories` | `check` | None                       | Job completed successfully.                                                           |
| [36333751792](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36333751792) / `cc9c5e9` | Pull request from `feat/connected-repositories` | `web`   | `Install web dependencies` | Same npm lockfile validation failure.                                                 |
| [36264703325](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36264703325) / `8320d5b` | Pull request from `feat/demo-dashboard`         | `web`   | `Install web dependencies` | First failed run after the web package was introduced; same missing lockfile entries. |
| [36341643811](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36341643811) / `5453418` | Pull request from `fix/ci-workflows`            | `check` | None                       | Root install and all root checks completed successfully.                              |
| [36341643811](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36341643811) / `5453418` | Pull request from `fix/ci-workflows`            | `web`   | `Run web checks`           | Install passed; one timing-sensitive issue handoff assertion failed.                  |
| [36341775846](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36341775846) / `3177bf4` | Push to `main`                                  | `check` | None                       | Root job completed successfully.                                                      |
| [36341775846](https://github.com/divejikan-yuvarajah/JevFlow/actions/runs/36341775846) / `3177bf4` | Push to `main`                                  | `web`   | None                       | Web install and all web checks completed successfully.                                |

The concise actionable log excerpt is:

```text
npm error `npm ci` can only install packages when your package.json and
package-lock.json ... are in sync.
npm error Missing: @emnapi/runtime@1.11.3 from lock file
npm error Missing: @emnapi/core@1.11.3 from lock file
```

The reported claim that both root and web jobs were failing was checked against the host. The current and historical runs above show the root `check` job passing. The workflow run is red because the independent `web` job fails.

The first repair corrected dependency installation. The next pull request run reached the web test suite and exposed this separate intermittent failure:

```text
FAIL tests/issue-form.test.tsx > issue form > hydrates a selected repository issue from session storage
Expected element to have value: Imported public issue
Received:
Tests: 1 failed, 80 passed (81)
```

The same commit subsequently passed all root and web checks in the `main` push run. That difference narrowed the remaining issue to test timing rather than a deterministic application or dependency failure.

## Root cause

`web/package-lock.json` contained optional WASM dependency edges that required top-level `@emnapi/runtime@1.11.3` and `@emnapi/core@1.11.3`, but it did not contain those package records. npm 10.8.2 validates the complete lock graph before installation and stopped with `EUSAGE`.

The missing packages are transitive optional dependencies used by the web toolchain (`sharp` and Tailwind's WASM fallback paths). No direct dependency version or application source change was required. The failure was reproduced locally with the runner's npm version:

```text
npx --yes --package=npm@10.8.2 npm --prefix web ci
→ EUSAGE, with the same two missing packages
```

The root package's install and complete check passed under the same npm version. The root install emits an existing `EBADENGINE` warning because `@octokit/rest` currently resolves `content-type@3.1.1`, whose declared engine is Node 22 or newer. This warning did not fail installation, tests, or builds and was not changed without evidence that it caused the CI failure.

### Follow-up test timing root cause

`IssueForm` renders an empty title field, then consumes the selected public issue from `sessionStorage` and schedules its state update with `queueMicrotask`. The test used `findByLabelText`, which waits only for the field to exist. Because the field exists on the initial render, that query can resolve before the queued state update. The following immediate value assertion therefore depended on scheduler timing.

The hosted pull request runner observed the empty initial value. A later hosted `main` run observed the populated value and passed, which is consistent with the race.

## Repair

The web lockfile was regenerated from the unchanged `web/package.json` with npm 10.8.2 using normal npm tooling:

```text
cd web
npx --yes --package=npm@10.8.2 npm install --package-lock-only
```

The resulting lockfile adds the missing `@emnapi` records, bundled WASM metadata, and npm 10's corresponding peer flags. `web/package.json`, dependency versions, application code, workflows, TypeSafe integration, confidence policy, GitHub automation, evaluation data, and dashboard behavior are unchanged.

The issue handoff test now uses Testing Library's `waitFor` around the expected title value. This waits for the asynchronous state transition that the test is intended to verify. It does not add a delay, skip a test, change production behavior, or weaken the expected value.

## Local verification

| Command                                             | Result                                                                                  |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Node 20.20.2 / npm 10.8.2 root `npm ci`             | **PASS** — 164 packages installed, 0 vulnerabilities reported                           |
| Node 20.20.2 / npm 10.8.2 web `npm ci` after repair | **PASS** — 475 packages installed, 0 vulnerabilities reported                           |
| `npm run format:check`                              | **PASS**                                                                                |
| `npm run typecheck`                                 | **PASS**                                                                                |
| `npm run lint`                                      | **PASS**                                                                                |
| `npm test`                                          | **PASS** — 25 files, 222 tests                                                          |
| `npm run build`                                     | **PASS**                                                                                |
| `npm run check`                                     | **PASS** — repeated all root checks                                                     |
| `npm --prefix web run format:check`                 | **PASS**                                                                                |
| `npm --prefix web run typecheck`                    | **PASS**                                                                                |
| `npm --prefix web run lint`                         | **PASS**                                                                                |
| `npm --prefix web test`                             | **PASS** — 14 files, 81 tests                                                           |
| Repeated issue handoff test (5 runs)                | **PASS** — 5/5 runs; 14 tests passed per run                                            |
| `npm --prefix web run build`                        | **PASS** — Next.js production build, including `/repositories` and its three API routes |
| `npm --prefix web run check`                        | **PASS** — repeated all web checks                                                      |
| `npm run eval -- --mode fixture`                    | **PASS** — 30/30 synthetic fixture cases; not Jev performance                           |
| `npm run triage -- --help`                          | **PASS** — help only; no inference                                                      |

The exact aggregate root and web checks also passed with portable Node 20.20.2 and npm 10.8.2, matching the hosted runner. Restricted Windows attempts stopped before application startup when Node could not inspect an ancestor directory or resolve user information. Repeating the same offline commands outside that restriction passed. These were local sandbox limitations and required no source change.

## Remote verification status

- Initial repair branch push: **PERFORMED BY USER** — commit `5453418` was tested by pull request run 36341643811.
- Pull request checks for `5453418`: **FAIL** — root passed; web exposed the timing-sensitive issue handoff assertion after installation succeeded.
- Post-merge `main` checks for `3177bf4`: **PASS** — both root and web jobs passed in run 36341775846.
- Follow-up timing correction: **LOCAL PASS** — the affected test passed five consecutive runs; the clean root and web aggregate checks also passed with Node 20.20.2/npm 10.8.2.
- Follow-up remote checks: **NOT VERIFIED** — the correction has not been pushed, and no merge is authorized.
- Existing failed runs: remain historical failures and are not expected to change.

After authorization, push the follow-up commit on `fix/ci-workflows` and confirm that both `check` and `web` pass for that exact commit before any further merge.

## Security and workflow boundaries

- `.github/workflows/ci.yml` remains offline with `contents: read` only.
- `.github/workflows/jevflow-triage.yml` is unchanged.
- No test was skipped, disabled, or weakened.
- No API key, GitHub token, environment file, or issue content was added to the repository or report.
- No live provider request, live evaluation, workflow dispatch, label mutation, or remote repository write was performed.
