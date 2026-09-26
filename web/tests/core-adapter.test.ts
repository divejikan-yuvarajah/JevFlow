import { describe, expect, it, vi } from 'vitest';
import { analyzeWithJevFlowCore } from '@/lib/core-adapter';
import { makeTriageResult } from './fixtures';

describe('server-only shared core adapter', () => {
  it('uses one analyzer result with the real policy and label mapper', async () => {
    const analyze = vi.fn().mockResolvedValue(
      makeTriageResult({
        issueType: 'feature',
        area: 'frontend',
        priority: 'high',
        security: 0.93,
      }),
    );
    const result = await analyzeWithJevFlowCore(
      { title: 'Synthetic shared-core request', body: '' },
      {
        analyze,
        config: { autoThreshold: 0.9, reviewThreshold: 0.75 },
      },
    );
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(result.policy.mode).toBe('human-review');
    expect(result.proposedLabels).toEqual([
      'jev:human-review',
      'security-review',
    ]);
    expect(result.source).toBe('live_jev');
  });
});
