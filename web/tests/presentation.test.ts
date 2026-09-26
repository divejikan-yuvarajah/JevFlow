import { describe, expect, it } from 'vitest';
import { presentTriageResult } from '@/lib/present-result';
import { makeTriageResult } from './fixtures';

describe('triage presentation adapter', () => {
  it('preserves selected probability and separately reported confidence', () => {
    const view = presentTriageResult(
      makeTriageResult({ issueProbability: 0.87, issueConfidence: 0.63 }),
      'live_jev',
      { autoThreshold: 0.9, reviewThreshold: 0.6 },
    );
    expect(view.issueType.selectedProbability).toBe(0.87);
    expect(view.issueType.reportedConfidence).toBe(0.63);
  });

  it('uses real policy and withholds speculative categories in human review', () => {
    const view = presentTriageResult(
      makeTriageResult({ security: 0.92, review: 0.88 }),
      'live_jev',
      { autoThreshold: 0.9, reviewThreshold: 0.75 },
    );
    expect(view.policy.mode).toBe('human-review');
    expect(view.policy.classificationLabelsWithheld).toBe(true);
    expect(view.proposedLabels).toEqual([
      'jev:human-review',
      'security-review',
    ]);
  });

  it('projects only actual live metadata and truncation evidence', () => {
    const live = presentTriageResult(
      makeTriageResult({ truncated: true }),
      'live_jev',
      { autoThreshold: 0.9, reviewThreshold: 0.75 },
    );
    expect(live.meta).toEqual({
      inputTruncated: true,
      truncatedFields: ['body'],
      model: 'jev-test-model',
      latencyMs: 123.4,
      usage: { inputTokens: 42, outputTokens: 7 },
    });
    expect(live.policy.reasonCodes).toContain(
      'input_truncated_review_suggested',
    );
  });
});
