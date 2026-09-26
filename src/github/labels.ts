import {
  isAutomationMode,
  isEngineeringArea,
  isIssuePriority,
  isIssueType,
  type AutomationMode,
  type EngineeringArea,
  type IssuePriority,
  type IssueType,
} from '../domain/constants.js';
import {
  POLICY_REASON_CODES,
  PolicyError,
  type TriagePlan,
} from '../policy/policy.types.js';
import type { TriageResult } from '../triage/triage.types.js';

export const TYPE_LABELS = {
  bug: 'type:bug',
  feature: 'type:feature',
  documentation: 'type:documentation',
  question: 'type:question',
  maintenance: 'type:maintenance',
} as const satisfies Record<IssueType, string>;

export const AREA_LABELS = {
  frontend: 'area:frontend',
  backend: 'area:backend',
  database: 'area:database',
  devops: 'area:devops',
  ai: 'area:ai',
  security: 'area:security',
  general: 'area:general',
} as const satisfies Record<EngineeringArea, string>;

export const PRIORITY_LABELS = {
  critical: 'priority:critical',
  high: 'priority:high',
  medium: 'priority:medium',
  low: 'priority:low',
} as const satisfies Record<IssuePriority, string>;

export const MODE_LABELS = {
  auto: 'jev:auto-triaged',
  'review-suggested': 'jev:review-suggested',
  'human-review': 'jev:human-review',
} as const satisfies Record<AutomationMode, string>;

export const SECURITY_REVIEW_LABEL = 'security-review' as const;

export const APPROVED_LABELS = [
  ...Object.values(TYPE_LABELS),
  ...Object.values(AREA_LABELS),
  ...Object.values(PRIORITY_LABELS),
  ...Object.values(MODE_LABELS),
  SECURITY_REVIEW_LABEL,
] as const;

export type ProposedLabel = (typeof APPROVED_LABELS)[number];

function isUnitValue(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function validateResult(result: unknown): asserts result is TriageResult {
  if (
    !isRecord(result) ||
    !isRecord(result.issueType) ||
    typeof result.issueType.value !== 'string' ||
    !isIssueType(result.issueType.value) ||
    !isRecord(result.engineeringArea) ||
    typeof result.engineeringArea.value !== 'string' ||
    !isEngineeringArea(result.engineeringArea.value) ||
    !isRecord(result.priority) ||
    typeof result.priority.value !== 'string' ||
    !isIssuePriority(result.priority.value)
  ) {
    throw new PolicyError(
      'Triage result or plan is invalid for label mapping.',
    );
  }
}

function validatePlan(plan: unknown): asserts plan is TriagePlan {
  if (
    !isRecord(plan) ||
    typeof plan.mode !== 'string' ||
    !isAutomationMode(plan.mode) ||
    !isRecord(plan.choiceScores) ||
    !isRecord(plan.thresholdsUsed) ||
    !isUnknownArray(plan.reasonCodes)
  ) {
    throw new PolicyError(
      'Triage result or plan is invalid for label mapping.',
    );
  }
  const scores = [
    plan.choiceScores.issueType,
    plan.choiceScores.engineeringArea,
    plan.choiceScores.priority,
  ];
  const reasons = plan.reasonCodes;
  if (
    !scores.every(isUnitValue) ||
    !isUnitValue(plan.overallChoiceGateScore) ||
    plan.overallChoiceGateScore !== Math.min(...scores) ||
    !isUnitValue(plan.thresholdsUsed.auto) ||
    !isUnitValue(plan.thresholdsUsed.review) ||
    plan.thresholdsUsed.review > plan.thresholdsUsed.auto ||
    typeof plan.securityReviewRequested !== 'boolean' ||
    typeof plan.inputTruncated !== 'boolean' ||
    new Set(reasons).size !== reasons.length ||
    !reasons.every(
      (reason) =>
        typeof reason === 'string' &&
        POLICY_REASON_CODES.some((allowed) => allowed === reason),
    ) ||
    (plan.securityReviewRequested && plan.mode !== 'human-review') ||
    (plan.mode === 'auto' &&
      plan.overallChoiceGateScore < plan.thresholdsUsed.auto)
  ) {
    throw new PolicyError(
      'Triage result or plan is invalid for label mapping.',
    );
  }
}

function categoryLabels(result: TriageResult): ProposedLabel[] {
  return [
    TYPE_LABELS[result.issueType.value],
    AREA_LABELS[result.engineeringArea.value],
    PRIORITY_LABELS[result.priority.value],
  ];
}

export function getProposedLabels(
  result: TriageResult,
  plan: TriagePlan,
): readonly ProposedLabel[] {
  validateResult(result);
  validatePlan(plan);

  const labels: ProposedLabel[] = [];
  if (plan.mode === 'auto') {
    labels.push(...categoryLabels(result));
  } else if (
    plan.mode === 'review-suggested' &&
    Object.values(plan.choiceScores).every(
      (score) => score >= plan.thresholdsUsed.review,
    )
  ) {
    labels.push(...categoryLabels(result));
  }

  labels.push(MODE_LABELS[plan.mode]);
  if (plan.securityReviewRequested) labels.push(SECURITY_REVIEW_LABEL);
  return labels;
}
