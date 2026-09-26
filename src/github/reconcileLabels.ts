import {
  APPROVED_LABELS,
  MODE_LABELS,
  SECURITY_REVIEW_LABEL,
  isApprovedLabel,
  type ProposedLabel,
} from './labels.js';
import { GitHubAutomationError } from './github.types.js';

export interface LabelReconciliation {
  readonly toAdd: readonly ProposedLabel[];
  readonly toRemove: readonly ProposedLabel[];
  readonly unchanged: readonly string[];
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function validateProposedLabels(
  labels: readonly string[],
): readonly ProposedLabel[] {
  if (labels.some((label) => !isApprovedLabel(label))) {
    throw new GitHubAutomationError(
      'invalid_label',
      'A proposed label is outside the JevFlow allowlist.',
    );
  }
  return unique(labels) as readonly ProposedLabel[];
}

function buildReconciliation(
  currentLabels: readonly string[],
  desiredLabels: readonly ProposedLabel[],
  removableLabels: ReadonlySet<ProposedLabel>,
): LabelReconciliation {
  const current = unique(currentLabels);
  const currentSet = new Set(current);
  const desiredSet = new Set(desiredLabels);
  const toAdd = APPROVED_LABELS.filter(
    (label) => desiredSet.has(label) && !currentSet.has(label),
  );
  const toRemove = APPROVED_LABELS.filter(
    (label) =>
      removableLabels.has(label) &&
      currentSet.has(label) &&
      !desiredSet.has(label),
  );
  const removeSet = new Set<string>(toRemove);
  return {
    toAdd,
    toRemove,
    unchanged: current.filter((label) => !removeSet.has(label)),
  };
}

const NORMAL_REMOVABLE = new Set<ProposedLabel>(
  APPROVED_LABELS.filter((label) => label !== SECURITY_REVIEW_LABEL),
);

const FALLBACK_REMOVABLE = new Set<ProposedLabel>([
  MODE_LABELS.auto,
  MODE_LABELS['review-suggested'],
]);

export function reconcileLabels(
  currentLabels: readonly string[],
  proposedLabels: readonly string[],
): LabelReconciliation {
  const proposed = [...validateProposedLabels(proposedLabels)];
  if (
    currentLabels.includes(SECURITY_REVIEW_LABEL) &&
    !proposed.includes(SECURITY_REVIEW_LABEL)
  ) {
    proposed.push(SECURITY_REVIEW_LABEL);
  }
  return buildReconciliation(currentLabels, proposed, NORMAL_REMOVABLE);
}

export function reconcileFailureLabels(
  currentLabels: readonly string[],
): LabelReconciliation {
  const desired: ProposedLabel[] = [MODE_LABELS['human-review']];
  if (currentLabels.includes(SECURITY_REVIEW_LABEL)) {
    desired.push(SECURITY_REVIEW_LABEL);
  }
  return buildReconciliation(currentLabels, desired, FALLBACK_REMOVABLE);
}
