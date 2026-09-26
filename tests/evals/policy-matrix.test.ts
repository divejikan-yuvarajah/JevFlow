import { describe, expect, it } from 'vitest';

import { APPROVED_LABELS, getProposedLabels } from '../../src/github/labels.js';
import { evaluateTriagePolicy } from '../../src/policy/confidenceGate.js';
import { createTriageResult } from '../fixtures/triage-result.js';

const CONFIG = { autoThreshold: 0.9, reviewThreshold: 0.75 } as const;

describe('evaluation policy regression matrix', () => {
  it.each([
    { score: 0.900_001, expected: 'auto' },
    { score: 0.9, expected: 'auto' },
    { score: 0.899_999, expected: 'review-suggested' },
    { score: 0.75, expected: 'review-suggested' },
    { score: 0.749_999, expected: 'human-review' },
  ] as const)(
    'keeps exact confidence gate behavior at $score',
    ({ score, expected }) => {
      const plan = evaluateTriagePolicy(
        createTriageResult({
          issueTypeProbability: score,
          issueTypeConfidence: score,
          engineeringAreaProbability: score,
          engineeringAreaConfidence: score,
          priorityProbability: score,
          priorityConfidence: score,
        }),
        CONFIG,
      );
      expect(plan.mode).toBe(expected);
    },
  );

  it.each([
    createTriageResult({ priority: 'critical' }),
    createTriageResult({ securityProbabilityYes: 0.5 }),
    createTriageResult({ humanReviewProbabilityYes: 0.5 }),
    createTriageResult({ inputTruncated: true }),
  ])('keeps risk and truncation overrides monotonic', (result) => {
    const plan = evaluateTriagePolicy(result, CONFIG);
    expect(plan.mode).not.toBe('auto');
  });

  it('omits speculative categories for human review and weak review-suggested evidence', () => {
    const humanResult = createTriageResult({ priorityConfidence: 0.5 });
    const humanPlan = evaluateTriagePolicy(humanResult, CONFIG);
    expect(getProposedLabels(humanResult, humanPlan)).toEqual([
      'jev:human-review',
    ]);

    const reviewResult = createTriageResult({ priorityConfidence: 0.8 });
    const reviewPlan = evaluateTriagePolicy(reviewResult, CONFIG);
    const weakenedPlan = {
      ...reviewPlan,
      choiceScores: { ...reviewPlan.choiceScores, priority: 0.7 },
      overallChoiceGateScore: 0.7,
    };
    expect(getProposedLabels(reviewResult, weakenedPlan)).toEqual([
      'jev:review-suggested',
    ]);
  });

  it('emits only canonical labels with one mutually exclusive mode marker', () => {
    const results = [
      createTriageResult(),
      createTriageResult({ priorityConfidence: 0.8 }),
      createTriageResult({ securityProbabilityYes: 0.5 }),
    ];

    for (const result of results) {
      const labels = getProposedLabels(
        result,
        evaluateTriagePolicy(result, CONFIG),
      );
      expect(labels.every((label) => APPROVED_LABELS.includes(label))).toBe(
        true,
      );
      expect(labels.filter((label) => label.startsWith('jev:'))).toHaveLength(
        1,
      );
    }
  });
});
