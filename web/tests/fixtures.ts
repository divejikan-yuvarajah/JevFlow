import {
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
  type EngineeringArea,
  type IssuePriority,
  type IssueType,
} from '../../dist/domain/constants.js';
import type { TriageResult } from '../../dist/triage/triage.types.js';
import type { PublicTriageView } from '@/lib/contracts';

function distribution<T extends string>(
  values: readonly T[],
  selected: T,
  probability: number,
): Readonly<Record<T, number>> {
  const remainder = (1 - probability) / (values.length - 1);
  return Object.fromEntries(
    values.map((value) => [
      value,
      value === selected ? probability : remainder,
    ]),
  ) as Record<T, number>;
}

export function makeTriageResult(
  overrides: Partial<{
    issueType: IssueType;
    area: EngineeringArea;
    priority: IssuePriority;
    issueProbability: number;
    issueConfidence: number;
    areaProbability: number;
    areaConfidence: number;
    priorityProbability: number;
    priorityConfidence: number;
    security: number;
    review: number;
    truncated: boolean;
  }> = {},
): TriageResult {
  const issueType = overrides.issueType ?? 'bug';
  const area = overrides.area ?? 'backend';
  const priority = overrides.priority ?? 'medium';
  const issueProbability = overrides.issueProbability ?? 0.96;
  const areaProbability = overrides.areaProbability ?? 0.95;
  const priorityProbability = overrides.priorityProbability ?? 0.94;
  const truncated = overrides.truncated ?? false;
  return {
    issueType: {
      value: issueType,
      selectedProbability: issueProbability,
      confidence: overrides.issueConfidence ?? 0.91,
      probabilities: distribution(ISSUE_TYPES, issueType, issueProbability),
    },
    engineeringArea: {
      value: area,
      selectedProbability: areaProbability,
      confidence: overrides.areaConfidence ?? 0.92,
      probabilities: distribution(ENGINEERING_AREAS, area, areaProbability),
    },
    priority: {
      value: priority,
      selectedProbability: priorityProbability,
      confidence: overrides.priorityConfidence ?? 0.93,
      probabilities: distribution(PRIORITIES, priority, priorityProbability),
    },
    securitySensitive: { probabilityYes: overrides.security ?? 0.1 },
    needsHumanReview: { probabilityYes: overrides.review ?? 0.12 },
    meta: {
      model: 'jev-test-model',
      latencyMs: 123.4,
      inputTruncated: truncated,
      truncatedFields: truncated ? ['body'] : [],
      usage: { inputTokens: 42, outputTokens: 7 },
    },
  };
}

export function makeLiveView(): PublicTriageView {
  return {
    source: 'live_jev',
    issueType: {
      value: 'bug',
      selectedProbability: 0.96,
      reportedConfidence: 0.81,
    },
    engineeringArea: {
      value: 'backend',
      selectedProbability: 0.94,
      reportedConfidence: 0.83,
    },
    priority: {
      value: 'medium',
      selectedProbability: 0.92,
      reportedConfidence: 0.84,
    },
    securitySensitiveProbabilityYes: 0.08,
    needsHumanReviewProbabilityYes: 0.12,
    policy: {
      mode: 'auto',
      reasonCodes: ['choice_auto_threshold_met'],
      overallChoiceGateScore: 0.81,
      thresholdsUsed: { auto: 0.8, review: 0.7 },
      classificationLabelsWithheld: false,
    },
    proposedLabels: [
      'type:bug',
      'area:backend',
      'priority:medium',
      'jev:auto-triaged',
    ],
    meta: {
      inputTruncated: false,
      truncatedFields: [],
      model: 'jev-test-model',
      latencyMs: 123.4,
      usage: { inputTokens: 42, outputTokens: 7 },
    },
  };
}
