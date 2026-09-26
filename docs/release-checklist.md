# JevFlow v0.1.0 Release Checklist

Status values reflect Task 07 evidence. A checked offline item does not imply live deployment or public-release approval.

## Documentation and reproducibility

- [x] README commands match root and web package scripts.
- [x] Architecture, development, testing, evaluation, security, and deployment docs match the reviewed implementation.
- [x] CLI example uses committed synthetic input and identifies its live provider call.
- [x] Fixture evaluation command and ignored report location are documented.
- [x] Synthetic, live, selected probability, reported confidence, and P(YES) terminology is consistent.
- [ ] Real public repository and demo URLs supplied.

## Offline QA

- [x] Baseline root `npm run check` passed before Task 07 edits.
- [x] Baseline web `npm --prefix web run check` passed before Task 07 edits.
- [x] Final root fresh install and all offline commands recorded in `release-report.md`.
- [x] Final web fresh install/check/build recorded in `release-report.md`.
- [x] Final 30-case fixture report generated and recorded.
- [x] Local browser desktop/mobile check explicitly marked **NOT RUN**; localhost HTTP smoke passed.

## Security and integration

- [x] Ignored environment files, placeholder examples, and tracked filenames reviewed.
- [x] Client/server boundary and default-disabled live route reviewed.
- [x] GitHub triggers, least privilege, repository scope, immutable action pins, and allowlisted labels reviewed.
- [x] Target template uses a public source owner and immutable commit placeholder.
- [x] Sticky `security-review`, human-label preservation, idempotence, and fallback behavior covered by tests.
- [x] Fresh installs reported 0 npm audit vulnerabilities in both packages; web ESLint deprecation warning recorded.

## External verification

- [ ] Paid/live Jev request approved and observed — **NOT RUN**.
- [ ] Target workflow installed on `jevflow-test-repo` default branch — **NOT DONE**.
- [ ] Real GitHub issue labeling and manual rerun observed — **NOT RUN**.
- [ ] Public web deployment observed — **NOT DONE**.
- [ ] Genuine screenshots captured — **PENDING**.

## Legal and publication

- [ ] Project owner selected and added a `LICENSE` — **PENDING; release blocker for public reuse terms**.
- [ ] Repository visibility, contribution/security contacts, and public links approved.
- [ ] Push separately authorized.
- [ ] Tag and GitHub release separately authorized.
- [ ] Hosting/deployment separately authorized and reviewed.

## Release decision

- Offline MVP decision: READY after final Task 07 validation.
- Live automation decision: not verified.
- Public release decision: pending license, links, external verification choice, and explicit publication authorization.
