import { describe, expect, it } from 'vitest';

import {
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
} from '../src/domain/constants.js';
import {
  APPROVED_LABELS,
  AREA_LABELS,
  MODE_LABELS,
  PRIORITY_LABELS,
  SECURITY_REVIEW_LABEL,
  TYPE_LABELS,
  getProposedLabels,
} from '../src/github/labels.js';
import { evaluateTriagePolicy } from '../src/policy/confidenceGate.js';
import { PolicyError } from '../src/policy/policy.types.js';
import { createTriageResult } from './fixtures/triage-result.js';

const THRESHOLDS = { autoThreshold: 0.9, reviewThreshold: 0.75 } as const;

describe('getProposedLabels', () => {
  it('maps auto mode to three categories and one mode label in stable order', () => {
    const result = createTriageResult({
      issueType: 'feature',
      engineeringArea: 'frontend',
      priority: 'high',
    });
    const plan = evaluateTriagePolicy(result, THRESHOLDS);

    expect(getProposedLabels(result, plan)).toEqual([
      'type:feature',
      'area:frontend',
      'priority:high',
      'jev:auto-triaged',
    ]);
  });

  it('includes review-suggested categories only when all scores meet review threshold', () => {
    const result = createTriageResult({ priorityConfidence: 0.8 });
    const plan = evaluateTriagePolicy(result, THRESHOLDS);
    expect(getProposedLabels(result, plan)).toEqual([
      'type:bug',
      'area:backend',
      'priority:medium',
      'jev:review-suggested',
    ]);

    const weakPlan = {
      ...plan,
      choiceScores: { ...plan.choiceScores, priority: 0.7 },
      overallChoiceGateScore: 0.7,
    };
    expect(getProposedLabels(result, weakPlan)).toEqual([
      'jev:review-suggested',
    ]);
  });

  it('omits all categories in human-review mode', () => {
    const result = createTriageResult({ issueTypeConfidence: 0.5 });
    const plan = evaluateTriagePolicy(result, THRESHOLDS);
    expect(getProposedLabels(result, plan)).toEqual(['jev:human-review']);
  });

  it('adds security-review only for the explicit policy flag', () => {
    const securityArea = createTriageResult({ engineeringArea: 'security' });
    const securityAreaPlan = evaluateTriagePolicy(securityArea, THRESHOLDS);
    expect(getProposedLabels(securityArea, securityAreaPlan)).not.toContain(
      SECURITY_REVIEW_LABEL,
    );

    const requested = createTriageResult({ securityProbabilityYes: 0.5 });
    const requestedPlan = evaluateTriagePolicy(requested, THRESHOLDS);
    expect(getProposedLabels(requested, requestedPlan)).toEqual([
      'jev:human-review',
      'security-review',
    ]);
  });

  it('rejects malformed plan evidence', () => {
    const result = createTriageResult();
    const plan = evaluateTriagePolicy(result, THRESHOLDS);
    expect(() =>
      getProposedLabels(result, {
        ...plan,
        overallChoiceGateScore: Number.NaN,
      }),
    ).toThrow(PolicyError);
  });

  it('is deterministic and emits no duplicate or conflicting mode labels', () => {
    const result = createTriageResult({ securityProbabilityYes: 0.5 });
    const plan = evaluateTriagePolicy(result, THRESHOLDS);
    const first = getProposedLabels(result, plan);
    const second = getProposedLabels(result, plan);

    expect(first).toEqual(second);
    expect(new Set(first).size).toBe(first.length);
    expect(first.filter((label) => label.startsWith('jev:'))).toHaveLength(1);
    expect(first.every((label) => APPROVED_LABELS.includes(label))).toBe(true);
  });
});

describe('canonical label catalog', () => {
  it('covers every Task 01 category and mode exactly', () => {
    expect(Object.keys(TYPE_LABELS)).toEqual([...ISSUE_TYPES]);
    expect(Object.keys(AREA_LABELS)).toEqual([...ENGINEERING_AREAS]);
    expect(Object.keys(PRIORITY_LABELS)).toEqual([...PRIORITIES]);
    expect(Object.values(MODE_LABELS)).toEqual([
      'jev:auto-triaged',
      'jev:review-suggested',
      'jev:human-review',
    ]);
  });
});
