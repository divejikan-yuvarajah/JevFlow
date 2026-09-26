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

export interface LabelDefinition {
  readonly name: ProposedLabel;
  readonly color: string;
  readonly description: string;
}

export const LABEL_DEFINITIONS = {
  'type:bug': {
    name: 'type:bug',
    color: 'D73A4A',
    description: 'JevFlow issue type: bug',
  },
  'type:feature': {
    name: 'type:feature',
    color: 'A2EEEF',
    description: 'JevFlow issue type: feature',
  },
  'type:documentation': {
    name: 'type:documentation',
    color: '0075CA',
    description: 'JevFlow issue type: documentation',
  },
  'type:question': {
    name: 'type:question',
    color: 'D876E3',
    description: 'JevFlow issue type: question',
  },
  'type:maintenance': {
    name: 'type:maintenance',
    color: 'C5DEF5',
    description: 'JevFlow issue type: maintenance',
  },
  'area:frontend': {
    name: 'area:frontend',
    color: '5319E7',
    description: 'JevFlow engineering area: frontend',
  },
  'area:backend': {
    name: 'area:backend',
    color: '5319E7',
    description: 'JevFlow engineering area: backend',
  },
  'area:database': {
    name: 'area:database',
    color: '5319E7',
    description: 'JevFlow engineering area: database',
  },
  'area:devops': {
    name: 'area:devops',
    color: '5319E7',
    description: 'JevFlow engineering area: DevOps',
  },
  'area:ai': {
    name: 'area:ai',
    color: '5319E7',
    description: 'JevFlow engineering area: AI',
  },
  'area:security': {
    name: 'area:security',
    color: '5319E7',
    description: 'JevFlow engineering area: security',
  },
  'area:general': {
    name: 'area:general',
    color: '5319E7',
    description: 'JevFlow engineering area: general',
  },
  'priority:critical': {
    name: 'priority:critical',
    color: 'B60205',
    description: 'JevFlow suggested priority: critical',
  },
  'priority:high': {
    name: 'priority:high',
    color: 'D93F0B',
    description: 'JevFlow suggested priority: high',
  },
  'priority:medium': {
    name: 'priority:medium',
    color: 'FBCA04',
    description: 'JevFlow suggested priority: medium',
  },
  'priority:low': {
    name: 'priority:low',
    color: '0E8A16',
    description: 'JevFlow suggested priority: low',
  },
  'jev:auto-triaged': {
    name: 'jev:auto-triaged',
    color: '0E8A16',
    description: 'JevFlow automatic triage completed',
  },
  'jev:review-suggested': {
    name: 'jev:review-suggested',
    color: 'FBCA04',
    description: 'JevFlow recommends maintainer review',
  },
  'jev:human-review': {
    name: 'jev:human-review',
    color: 'D93F0B',
    description: 'JevFlow requires human review',
  },
  'security-review': {
    name: 'security-review',
    color: 'B60205',
    description: 'Human security review requested; vulnerability unconfirmed',
  },
} as const satisfies Record<ProposedLabel, LabelDefinition>;

export function isApprovedLabel(value: string): value is ProposedLabel {
  return APPROVED_LABELS.some((approved) => approved === value);
}

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
