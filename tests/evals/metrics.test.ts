import { describe, expect, it } from 'vitest';

import type {
  EvaluationCaseResult,
  EvaluationSuccess,
} from '../../src/evaluation/evaluation.types.js';
import {
  calculateEvaluationSummary,
  distributionStats,
  ratio,
} from '../../src/evaluation/metrics.js';

function success(
  overrides: Partial<EvaluationSuccess> & Pick<EvaluationSuccess, 'id'>,
): EvaluationSuccess {
  const { id, ...changes } = overrides;
  return {
    id,
    status: 'succeeded',
    expected: {
      issueType: 'bug',
      engineeringArea: 'backend',
      priority: 'high',
      securitySensitive: false,
      needsHumanReview: false,
      annotationConfidence: 'high',
      rationale: 'Synthetic metric test annotation.',
    },
    predicted: {
      issueType: 'bug',
      engineeringArea: 'backend',
      priority: 'high',
    },
    choiceEvidence: {
      issueType: { selectedProbability: 0.9, reportedConfidence: 0.7 },
      engineeringArea: {
        selectedProbability: 0.8,
        reportedConfidence: 0.6,
      },
      priority: { selectedProbability: 0.7, reportedConfidence: 0.5 },
    },
    securityProbabilityYes: 0.2,
    humanReviewProbabilityYes: 0.3,
    policyMode: 'auto',
    overallChoiceGateScore: 0.9,
    securityReviewRequested: false,
    reasonCodes: ['choice_auto_threshold_met'],
    proposedLabels: [
      'type:bug',
      'area:backend',
      'priority:high',
      'jev:auto-triaged',
    ],
    evaluatorDurationMs: 2,
    providerLatencyMs: null,
    ...changes,
  };
}

describe('metric primitives', () => {
  it('returns null instead of NaN or Infinity for zero denominators', () => {
    expect(ratio(0, 0)).toEqual({ numerator: 0, denominator: 0, rate: null });
    expect(JSON.stringify(ratio(0, 0))).not.toMatch(/NaN|Infinity/u);
  });

  it('calculates average, median, and nearest-rank p95', () => {
    expect(distributionStats([1, 2, 3])).toEqual({
      count: 3,
      average: 2,
      median: 2,
      p95: 3,
    });
    expect(distributionStats([1, 2, 3, 4])).toEqual({
      count: 4,
      average: 2.5,
      median: 2.5,
      p95: 4,
    });
    expect(distributionStats([Number.NaN])).toEqual({
      count: 0,
      average: null,
      median: null,
      p95: null,
    });
  });
});

describe('calculateEvaluationSummary', () => {
  const cases: readonly EvaluationCaseResult[] = [
    success({
      id: 'JF-001',
      expected: {
        issueType: 'bug',
        engineeringArea: 'backend',
        priority: 'high',
        securitySensitive: true,
        needsHumanReview: true,
        annotationConfidence: 'high',
        rationale: 'Should have been reviewed.',
      },
    }),
    success({
      id: 'JF-002',
      expected: {
        issueType: 'bug',
        engineeringArea: 'general',
        priority: 'medium',
        securitySensitive: false,
        needsHumanReview: true,
        acceptableAlternativeAreas: ['frontend'],
        annotationConfidence: 'low',
        rationale: 'Area is explicitly ambiguous.',
      },
      predicted: {
        issueType: 'bug',
        engineeringArea: 'frontend',
        priority: 'high',
      },
      policyMode: 'review-suggested',
      overallChoiceGateScore: 0.8,
      reasonCodes: ['choice_review_threshold_met'],
      proposedLabels: [
        'type:bug',
        'area:frontend',
        'priority:high',
        'jev:review-suggested',
      ],
    }),
    success({
      id: 'JF-003',
      expected: {
        issueType: 'bug',
        engineeringArea: 'backend',
        priority: 'high',
        securitySensitive: true,
        needsHumanReview: true,
        annotationConfidence: 'high',
        rationale: 'Security review is expected.',
      },
      policyMode: 'human-review',
      overallChoiceGateScore: 0.6,
      securityReviewRequested: true,
      securityProbabilityYes: 0.9,
      humanReviewProbabilityYes: 0.8,
      reasonCodes: [
        'choice_below_review_threshold',
        'security_probability_manual_review',
      ],
      proposedLabels: ['jev:human-review', 'security-review'],
    }),
    {
      id: 'JF-004',
      status: 'failed',
      errorCode: 'provider_unavailable',
      evaluatorDurationMs: 4,
    },
  ];

  it('uses successful cases as classification denominators and keeps failures in accounting', () => {
    const summary = calculateEvaluationSummary(cases, 'offline-fixture');

    expect(summary.accounting).toMatchObject({
      total: 4,
      succeeded: 3,
      failed: 1,
      skipped: 0,
      failuresByCode: { provider_unavailable: 1 },
    });
    expect(summary.classification.issueType.strictAccuracy).toEqual(
      ratio(3, 3),
    );
    expect(summary.classification.engineeringArea.strictAccuracy).toEqual(
      ratio(2, 3),
    );
    expect(
      summary.classification.engineeringArea.acceptableAnswerAccuracy,
    ).toEqual(ratio(3, 3));
    expect(summary.classification.priority.strictAccuracy).toEqual(ratio(2, 3));
    expect(summary.classification.exactAllThreeAccuracy).toEqual(ratio(2, 3));
  });

  it('computes automation, review capture, false-auto, and security cohorts', () => {
    const automation = calculateEvaluationSummary(
      cases,
      'offline-fixture',
    ).automation;

    expect(automation).toMatchObject({
      autoCount: 1,
      reviewSuggestedCount: 1,
      humanReviewCount: 1,
      falseAutoCount: 1,
    });
    expect(automation.automationCoverage).toEqual(ratio(1, 3));
    expect(
      (automation.autoProportion.rate ?? 0) +
        (automation.reviewSuggestedProportion.rate ?? 0) +
        (automation.humanReviewProportion.rate ?? 0),
    ).toBeCloseTo(1);
    expect(automation.automatedSubsetClassificationAccuracy).toEqual(
      ratio(1, 1),
    );
    expect(automation.reviewRequiredCapture).toEqual(ratio(2, 3));
    expect(automation.strictHumanReviewRate).toEqual(ratio(1, 3));
    expect(automation.securityReviewRequestedRate).toEqual(ratio(1, 2));
    expect(automation.securityHumanReviewRate).toEqual(ratio(1, 2));
  });

  it('keeps selected probability, reported confidence, and P(YES) separate', () => {
    const probabilities = calculateEvaluationSummary(
      cases,
      'offline-fixture',
    ).probabilities;

    expect(probabilities.issueType.selectedProbability.average).toBe(0.9);
    expect(probabilities.issueType.reportedConfidence.average).toBeCloseTo(0.7);
    expect(
      probabilities.securityProbabilityYes.annotatedYes.average,
    ).toBeCloseTo(0.55);
    expect(
      probabilities.humanReviewProbabilityYes.annotatedYes.average,
    ).toBeCloseTo((0.3 + 0.3 + 0.8) / 3);
  });

  it('returns N/A-compatible null metrics for no successful records', () => {
    const summary = calculateEvaluationSummary(
      [
        {
          id: 'JF-001',
          status: 'failed',
          errorCode: 'unexpected_error',
          evaluatorDurationMs: 1,
        },
      ],
      'live-jev',
    );

    expect(summary.classification.exactAllThreeAccuracy.rate).toBeNull();
    expect(summary.automation.automationCoverage.rate).toBeNull();
    expect(summary.latency.successfulProviderLatencyMs).toEqual({
      count: 0,
      average: null,
      median: null,
      p95: null,
    });
    expect(JSON.stringify(summary)).not.toMatch(/NaN|Infinity/u);
  });
});
