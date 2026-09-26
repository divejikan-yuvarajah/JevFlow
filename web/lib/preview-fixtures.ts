import {
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
  type EngineeringArea,
  type IssuePriority,
  type IssueType,
} from '../../dist/domain/constants.js';
import {
  DEFAULT_AUTO_THRESHOLD,
  DEFAULT_REVIEW_THRESHOLD,
} from '../../dist/policy/thresholds.js';
import type { TriageResult } from '../../dist/triage/triage.types.js';
import type { PublicTriageView } from './contracts';
import { presentTriageResult } from './present-result';

export interface PreviewScenario {
  readonly id: 'api-auth' | 'invoice-access' | 'vague-performance';
  readonly category: string;
  readonly title: string;
  readonly body: string;
  readonly result: PublicTriageView;
}

function probabilities<T extends string>(
  values: readonly T[],
  selected: T,
  selectedProbability: number,
): Readonly<Record<T, number>> {
  const remainder = (1 - selectedProbability) / (values.length - 1);
  return Object.fromEntries(
    values.map((value) => [
      value,
      value === selected ? selectedProbability : remainder,
    ]),
  ) as Record<T, number>;
}

function fixtureResult(input: {
  readonly issueType: readonly [IssueType, number, number];
  readonly engineeringArea: readonly [EngineeringArea, number, number];
  readonly priority: readonly [IssuePriority, number, number];
  readonly securityProbabilityYes: number;
  readonly humanReviewProbabilityYes: number;
}): TriageResult {
  const [issueType, issueTypeProbability, issueTypeConfidence] =
    input.issueType;
  const [area, areaProbability, areaConfidence] = input.engineeringArea;
  const [priority, priorityProbability, priorityConfidence] = input.priority;
  return {
    issueType: {
      value: issueType,
      selectedProbability: issueTypeProbability,
      confidence: issueTypeConfidence,
      probabilities: probabilities(
        ISSUE_TYPES,
        issueType,
        issueTypeProbability,
      ),
    },
    engineeringArea: {
      value: area,
      selectedProbability: areaProbability,
      confidence: areaConfidence,
      probabilities: probabilities(ENGINEERING_AREAS, area, areaProbability),
    },
    priority: {
      value: priority,
      selectedProbability: priorityProbability,
      confidence: priorityConfidence,
      probabilities: probabilities(PRIORITIES, priority, priorityProbability),
    },
    securitySensitive: { probabilityYes: input.securityProbabilityYes },
    needsHumanReview: { probabilityYes: input.humanReviewProbabilityYes },
    meta: {
      model: 'synthetic-fixture',
      latencyMs: 0,
      inputTruncated: false,
      truncatedFields: [],
      usage: { inputTokens: 0, outputTokens: 0 },
    },
  };
}

const fixturePolicy = {
  autoThreshold: DEFAULT_AUTO_THRESHOLD,
  reviewThreshold: DEFAULT_REVIEW_THRESHOLD,
};

export const PREVIEW_SCENARIOS: readonly PreviewScenario[] = [
  {
    id: 'api-auth',
    category: 'Ordinary backend bug',
    title: 'API sessions expire immediately after sign-in',
    body: 'After a successful password sign-in, the API returns a session cookie that expires on the next request. This affects the staging environment and started after the session middleware update.',
    result: presentTriageResult(
      fixtureResult({
        issueType: ['bug', 0.96, 0.94],
        engineeringArea: ['backend', 0.94, 0.92],
        priority: ['high', 0.93, 0.91],
        securityProbabilityYes: 0.08,
        humanReviewProbabilityYes: 0.12,
      }),
      'synthetic_fixture',
      fixturePolicy,
    ),
  },
  {
    id: 'invoice-access',
    category: 'Possible security escalation',
    title: 'Invoice endpoint may return another account’s record',
    body: 'A synthetic tenant-isolation test suggests that changing an invoice identifier can return a record belonging to a different demo account. Please investigate without treating this report as a confirmed vulnerability.',
    result: presentTriageResult(
      fixtureResult({
        issueType: ['bug', 0.91, 0.89],
        engineeringArea: ['security', 0.94, 0.91],
        priority: ['critical', 0.92, 0.9],
        securityProbabilityYes: 0.92,
        humanReviewProbabilityYes: 0.88,
      }),
      'synthetic_fixture',
      fixturePolicy,
    ),
  },
  {
    id: 'vague-performance',
    category: 'Ambiguous report',
    title: 'The dashboard feels slower lately',
    body: 'Some screens seem slower than before, but there are no timings, affected routes, browser details, or steps to reproduce yet.',
    result: presentTriageResult(
      fixtureResult({
        issueType: ['question', 0.71, 0.64],
        engineeringArea: ['general', 0.62, 0.58],
        priority: ['medium', 0.68, 0.61],
        securityProbabilityYes: 0.08,
        humanReviewProbabilityYes: 0.74,
      }),
      'synthetic_fixture',
      fixturePolicy,
    ),
  },
] as const;

export function findMatchingPreview(
  title: string,
  body: string,
): PreviewScenario | undefined {
  return PREVIEW_SCENARIOS.find(
    (scenario) => scenario.title === title && scenario.body === body,
  );
}
