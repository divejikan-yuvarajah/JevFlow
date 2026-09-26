import { describe, expect, it, vi } from 'vitest';

import type { ParsedGitHubEvent } from '../../src/github/github.types.js';
import { reconcileLabels } from '../../src/github/reconcileLabels.js';
import { runGitHubTriage } from '../../src/github/runTriage.js';
import { TriageError } from '../../src/triage/triage.types.js';
import { createTriageResult } from '../fixtures/triage-result.js';
import { createFakeGitHubApi, TARGET } from '../github/helpers.js';

const EVENT: ParsedGitHubEvent = {
  kind: 'issue-opened',
  issue: {
    target: TARGET,
    input: {
      title: 'Offline integration issue',
      body: 'Synthetic evaluation adapter test.',
      issueNumber: 42,
      repository: 'example/jevflow',
    },
  },
};

const CONFIG = { autoThreshold: 0.9, reviewThreshold: 0.75 } as const;

describe('Task 04 integration regression', () => {
  it('passes a fake event through the existing orchestrator with no Octokit call', async () => {
    const api = createFakeGitHubApi();
    api.listIssueLabels.mockResolvedValue(['community:accepted']);
    const analyze = vi.fn().mockResolvedValue(
      createTriageResult({
        issueType: 'feature',
        engineeringArea: 'frontend',
        priority: 'medium',
      }),
    );

    const outcome = await runGitHubTriage(EVENT, {
      api,
      analyze,
      getConfig: () => CONFIG,
    });

    expect(outcome.exitCode).toBe(0);
    expect(analyze).toHaveBeenCalledOnce();
    expect(api.addLabels).toHaveBeenCalledWith(TARGET, [
      'type:feature',
      'area:frontend',
      'priority:medium',
      'jev:auto-triaged',
    ]);
    expect(api.removeLabel).not.toHaveBeenCalled();
  });

  it('keeps provider failure on the existing no-prediction fallback path', async () => {
    const api = createFakeGitHubApi();
    api.listIssueLabels.mockResolvedValue([
      'type:feature',
      'security-review',
      'jev:auto-triaged',
      'community:accepted',
    ]);

    const outcome = await runGitHubTriage(EVENT, {
      api,
      analyze: vi
        .fn()
        .mockRejectedValue(
          new TriageError('provider_unavailable', 'sanitized test failure'),
        ),
      getConfig: () => CONFIG,
    });

    expect(outcome.summary).toMatchObject({
      status: 'human-review-fallback',
      failureCode: 'provider_unavailable',
    });
    expect(outcome.summary).not.toHaveProperty('result');
    expect(api.addLabels).toHaveBeenCalledWith(TARGET, ['jev:human-review']);
    expect(api.removeLabel).toHaveBeenCalledWith(TARGET, 'jev:auto-triaged');
  });

  it('preserves user labels and sticky security review on repeated reconciliation', () => {
    const current = [
      'community:accepted',
      'security-review',
      'type:bug',
      'area:backend',
      'priority:high',
      'jev:auto-triaged',
    ];
    const desired = [
      'type:bug',
      'area:backend',
      'priority:high',
      'jev:auto-triaged',
    ];

    const plan = reconcileLabels(current, desired);

    expect(plan.toAdd).toEqual([]);
    expect(plan.toRemove).toEqual([]);
    expect(plan.unchanged).toContain('community:accepted');
    expect(plan.unchanged).toContain('security-review');
  });
});
