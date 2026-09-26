# Evaluation annotation guide

The dataset is a small, synthetic engineering sample annotated by the project authoring process. It is a transparent test rubric, not expert consensus or objective ground truth.

## Issue type

- `bug`: reported behavior contradicts an existing expectation or previously working behavior.
- `feature`: requests a new capability or an intentional expansion of behavior.
- `documentation`: requests prose, examples, or reference improvements without a runtime defect.
- `question`: primarily asks whether behavior is intended or how to proceed.
- `maintenance`: dependency, CI, refactoring, cleanup, or lifecycle work intended to preserve behavior.

Choose the primary user intent. For example, a documentation build regression is a `bug`, while missing explanatory prose is `documentation`.

## Engineering area

- `frontend`: browser interface, layout, accessibility, or client interaction.
- `backend`: service logic, APIs, authorization enforcement, jobs, or server sessions.
- `database`: schema, migration, query, transaction, index, or database topology.
- `devops`: CI, deployment, packaging, runtime images, or operational automation.
- `ai`: retrieval, model output, agent control, or other AI-specific behavior.
- `security`: security handling is the primary technical owner, such as disclosure or account enumeration.
- `general`: the evidence is cross-cutting, documentation-wide, or insufficient to name a narrower owner.

The primary area remains the strict annotation. Add `acceptableAlternativeAreas` only when the issue itself supports a second plausible owner. Alternatives must not repeat the primary value. Reports retain strict area accuracy and show acceptable-answer accuracy separately.

## Priority

- `critical`: active or imminent severe availability, integrity, credential, or cross-tenant risk requiring immediate response.
- `high`: blocks a key workflow, creates substantial compliance/security exposure, or risks important data without a safe routine path.
- `medium`: meaningful defect or scoped feature with a workaround or non-urgent impact.
- `low`: clarification, documentation, cleanup, or optional improvement with limited immediate impact.

Priority is the scenario annotation, not a promise about a real service-level objective.

## Boolean annotations

`securitySensitive: true` means the fictional report contains access-control, disclosure, credential, privacy, or comparable security handling concerns. It does not mean a vulnerability is confirmed.

`needsHumanReview: true` means automatic action would be inappropriate because the impact is critical, the scenario is security-sensitive, evidence is materially ambiguous, or an AI/agent behavior has consequential risk. This is a human annotation and is separate from the model's numeric P(YES).

## Confidence and rationale

- `high`: the text clearly supports one annotation under this rubric.
- `medium`: the primary label is supported, but another interpretation is credible.
- `low`: missing evidence or deliberate ambiguity makes the annotation provisional.

Every record needs a concise rationale explaining the primary type, area, priority, and review decision. A rationale cannot cite fixture output or be changed merely to improve measured accuracy.

## Review process

For a revision, compare the issue text against this rubric, record disagreements, and update dataset version plus matching fixtures. Keep strict and acceptable-area decisions explicit. At least one reviewer should check security and critical cases for fictional details and safe wording. The current dataset has been internally reviewed for schema and rubric consistency; it is not claimed to have external expert review.
