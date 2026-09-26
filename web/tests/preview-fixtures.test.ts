import { describe, expect, it } from 'vitest';
import { isPublicTriageView } from '@/lib/contracts';
import { findMatchingPreview, PREVIEW_SCENARIOS } from '@/lib/preview-fixtures';

describe('offline preview scenarios', () => {
  it('provides exactly three distinct valid synthetic scenarios', () => {
    expect(PREVIEW_SCENARIOS).toHaveLength(3);
    expect(new Set(PREVIEW_SCENARIOS.map((item) => item.id)).size).toBe(3);
    expect(
      PREVIEW_SCENARIOS.every((item) => isPublicTriageView(item.result)),
    ).toBe(true);
    expect(
      PREVIEW_SCENARIOS.every(
        (item) => item.result.source === 'synthetic_fixture',
      ),
    ).toBe(true);
  });

  it('matches only an unmodified scenario', () => {
    const sample = PREVIEW_SCENARIOS[1];
    expect(sample).toBeDefined();
    expect(findMatchingPreview(sample!.title, sample!.body)?.id).toBe(
      sample!.id,
    );
    expect(
      findMatchingPreview(`${sample!.title} edited`, sample!.body),
    ).toBeUndefined();
    expect(
      findMatchingPreview(sample!.title, `${sample!.body}\nMore`),
    ).toBeUndefined();
  });

  it('covers automatic, security escalation, and ambiguous review behavior', () => {
    expect(PREVIEW_SCENARIOS.map((item) => item.result.policy.mode)).toEqual([
      'auto',
      'human-review',
      'human-review',
    ]);
    expect(PREVIEW_SCENARIOS[1]?.result.proposedLabels).toEqual([
      'jev:human-review',
      'security-review',
    ]);
  });
});
