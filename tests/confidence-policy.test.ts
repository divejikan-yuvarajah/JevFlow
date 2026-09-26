import { describe, expect, it } from 'vitest';

import { evaluateTriagePolicy } from '../src/policy/confidenceGate.js';
import { PolicyError } from '../src/policy/policy.types.js';
import {
  CAUTION_YES_THRESHOLD,
  HUMAN_REVIEW_YES_THRESHOLD,
  SECURITY_REVIEW_YES_THRESHOLD,
} from '../src/policy/thresholds.js';
import { createTriageResult } from './fixtures/triage-result.js';

const DEFAULT_THRESHOLDS = {
  autoThreshold: 0.9,
  reviewThreshold: 0.75,
} as const;

describe('evaluateTriagePolicy choice gate', () => {
  it('uses inclusive auto and review boundaries without rounding', () => {
    expect(
      evaluateTriagePolicy(
        createTriageResult({
          issueTypeProbability: 0.9,
          issueTypeConfidence: 0.9,
          engineeringAreaProbability: 0.9,
          engineeringAreaConfidence: 0.9,
          priorityProbability: 0.9,
          priorityConfidence: 0.9,
        }),
        DEFAULT_THRESHOLDS,
      ).mode,
    ).toBe('auto');
    expect(
      evaluateTriagePolicy(
        createTriageResult({ priorityConfidence: 0.899_999 }),
        DEFAULT_THRESHOLDS,
      ).mode,
    ).toBe('review-suggested');
    expect(
      evaluateTriagePolicy(
        createTriageResult({
          issueTypeProbability: 0.75,
          issueTypeConfidence: 0.75,
          engineeringAreaProbability: 0.75,
          engineeringAreaConfidence: 0.75,
          priorityProbability: 0.75,
          priorityConfidence: 0.75,
        }),
        DEFAULT_THRESHOLDS,
      ).mode,
    ).toBe('review-suggested');
    expect(
      evaluateTriagePolicy(
        createTriageResult({ priorityConfidence: 0.749_999 }),
        DEFAULT_THRESHOLDS,
      ).mode,
    ).toBe('human-review');
  });

  it('uses the minimum of selected probability and reported confidence', () => {
    const plan = evaluateTriagePolicy(
      createTriageResult({
        issueTypeProbability: 0.99,
        issueTypeConfidence: 0.7,
      }),
      DEFAULT_THRESHOLDS,
    );
    expect(plan.choiceScores.issueType).toBe(0.7);
    expect(plan.mode).toBe('human-review');
  });

  it('uses the weakest choice instead of an average', () => {
    const plan = evaluateTriagePolicy(
      createTriageResult({
        issueTypeProbability: 0.99,
        issueTypeConfidence: 0.98,
        engineeringAreaProbability: 0.98,
        engineeringAreaConfidence: 0.96,
        priorityProbability: 0.97,
        priorityConfidence: 0.76,
      }),
      DEFAULT_THRESHOLDS,
    );
    expect(plan.choiceScores).toEqual({
      issueType: 0.98,
      engineeringArea: 0.96,
      priority: 0.76,
    });
    expect(plan.overallChoiceGateScore).toBe(0.76);
    expect(plan.mode).toBe('review-suggested');
  });

  it('supports custom and equal valid thresholds with auto tested first', () => {
    const result = createTriageResult({ priorityConfidence: 0.7 });
    expect(
      evaluateTriagePolicy(result, {
        autoThreshold: 0.8,
        reviewThreshold: 0.6,
      }).mode,
    ).toBe('review-suggested');
    expect(
      evaluateTriagePolicy(createTriageResult({ priorityConfidence: 0.75 }), {
        autoThreshold: 0.75,
        reviewThreshold: 0.75,
      }).mode,
    ).toBe('auto');
  });

  it.each([
    { autoThreshold: Number.NaN, reviewThreshold: 0.75 },
    { autoThreshold: 1.1, reviewThreshold: 0.75 },
    { autoThreshold: 0.8, reviewThreshold: 0.9 },
    { autoThreshold: 0.8, reviewThreshold: -0.1 },
  ])('rejects invalid policy config', (config) => {
    expect(() => evaluateTriagePolicy(createTriageResult(), config)).toThrow(
      PolicyError,
    );
  });

  it('rejects malformed normalized probabilities', () => {
    expect(() =>
      evaluateTriagePolicy(
        createTriageResult({ issueTypeProbability: Number.POSITIVE_INFINITY }),
        DEFAULT_THRESHOLDS,
      ),
    ).toThrow(PolicyError);
  });
});

describe('evaluateTriagePolicy safety overrides', () => {
  it('forces critical priority to human review', () => {
    const plan = evaluateTriagePolicy(
      createTriageResult({ priority: 'critical' }),
      DEFAULT_THRESHOLDS,
    );
    expect(plan.mode).toBe('human-review');
    expect(plan.reasonCodes).toContain('critical_priority_manual_review');
  });

  it('uses the exact security manual-review boundary and flag', () => {
    const atBoundary = evaluateTriagePolicy(
      createTriageResult({
        securityProbabilityYes: SECURITY_REVIEW_YES_THRESHOLD,
      }),
      DEFAULT_THRESHOLDS,
    );
    const belowBoundary = evaluateTriagePolicy(
      createTriageResult({ securityProbabilityYes: 0.499_999 }),
      DEFAULT_THRESHOLDS,
    );
    expect(atBoundary.mode).toBe('human-review');
    expect(atBoundary.securityReviewRequested).toBe(true);
    expect(belowBoundary.securityReviewRequested).toBe(false);
    expect(belowBoundary.mode).toBe('review-suggested');
  });

  it('uses the exact human-review P(YES) boundary', () => {
    const plan = evaluateTriagePolicy(
      createTriageResult({
        humanReviewProbabilityYes: HUMAN_REVIEW_YES_THRESHOLD,
      }),
      DEFAULT_THRESHOLDS,
    );
    expect(plan.mode).toBe('human-review');
    expect(plan.reasonCodes).toContain(
      'human_review_probability_manual_review',
    );
  });

  it('uses exact caution boundaries for both P(YES) values', () => {
    const securityCaution = evaluateTriagePolicy(
      createTriageResult({ securityProbabilityYes: CAUTION_YES_THRESHOLD }),
      DEFAULT_THRESHOLDS,
    );
    const humanCaution = evaluateTriagePolicy(
      createTriageResult({ humanReviewProbabilityYes: CAUTION_YES_THRESHOLD }),
      DEFAULT_THRESHOLDS,
    );
    const below = evaluateTriagePolicy(
      createTriageResult({
        securityProbabilityYes: 0.349_999,
        humanReviewProbabilityYes: 0.349_999,
      }),
      DEFAULT_THRESHOLDS,
    );
    expect(securityCaution.mode).toBe('review-suggested');
    expect(humanCaution.mode).toBe('review-suggested');
    expect(below.mode).toBe('auto');
  });

  it('never downgrades an already more cautious result', () => {
    const plan = evaluateTriagePolicy(
      createTriageResult({
        issueTypeConfidence: 0.5,
        securityProbabilityYes: CAUTION_YES_THRESHOLD,
      }),
      DEFAULT_THRESHOLDS,
    );
    expect(plan.mode).toBe('human-review');
  });

  it('raises truncated input to at least review-suggested', () => {
    const plan = evaluateTriagePolicy(
      createTriageResult({ inputTruncated: true }),
      DEFAULT_THRESHOLDS,
    );
    expect(plan.mode).toBe('review-suggested');
    expect(plan.inputTruncated).toBe(true);
    expect(plan.reasonCodes).toContain('input_truncated_review_suggested');
  });

  it('records multiple reasons once in deterministic order', () => {
    const plan = evaluateTriagePolicy(
      createTriageResult({
        priority: 'critical',
        securityProbabilityYes: 0.5,
        humanReviewProbabilityYes: 0.5,
        inputTruncated: true,
      }),
      DEFAULT_THRESHOLDS,
    );
    expect(plan.reasonCodes).toEqual([
      'choice_auto_threshold_met',
      'critical_priority_manual_review',
      'security_probability_manual_review',
      'human_review_probability_manual_review',
      'input_truncated_review_suggested',
    ]);
    expect(new Set(plan.reasonCodes).size).toBe(plan.reasonCodes.length);
  });
});
