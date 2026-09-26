import { describe, expect, it, vi } from 'vitest';

import { applyLabelReconciliation } from '../../src/github/issueActions.js';
import type { LabelReconciliation } from '../../src/github/reconcileLabels.js';
import { createFakeGitHubApi, TARGET } from './helpers.js';

const PLAN: LabelReconciliation = {
  toAdd: ['type:bug', 'jev:auto-triaged'],
  toRemove: ['type:feature', 'jev:review-suggested'],
  unchanged: ['community:help-wanted'],
};

describe('applyLabelReconciliation', () => {
  it('ensures and adds desired labels before removing stale labels', async () => {
    const calls: string[] = [];
    const api = createFakeGitHubApi();
    api.ensureLabel.mockImplementation((_repository, definition) => {
      calls.push(`ensure:${definition.name}`);
      return Promise.resolve(
        definition.name === 'type:bug' ? 'created' : 'existing',
      );
    });
    api.addLabels.mockImplementation((_target, labels) => {
      calls.push(`add:${labels.join(',')}`);
      return Promise.resolve();
    });
    api.removeLabel.mockImplementation((_target, label) => {
      calls.push(`remove:${label}`);
      return Promise.resolve();
    });

    const report = await applyLabelReconciliation(api, TARGET, PLAN);

    expect(calls).toEqual([
      'ensure:type:bug',
      'ensure:jev:auto-triaged',
      'add:type:bug,jev:auto-triaged',
      'remove:type:feature',
      'remove:jev:review-suggested',
    ]);
    expect(report).toEqual({
      status: 'completed',
      created: ['type:bug'],
      added: ['type:bug', 'jev:auto-triaged'],
      removed: ['type:feature', 'jev:review-suggested'],
      unchanged: ['community:help-wanted'],
      failures: [],
    });
  });

  it('performs zero writes for an idempotent plan', async () => {
    const api = createFakeGitHubApi();
    const report = await applyLabelReconciliation(api, TARGET, {
      toAdd: [],
      toRemove: [],
      unchanged: ['type:bug'],
    });

    expect(api.ensureLabel).not.toHaveBeenCalled();
    expect(api.addLabels).not.toHaveBeenCalled();
    expect(api.removeLabel).not.toHaveBeenCalled();
    expect(report.status).toBe('completed');
  });

  it('does not remove labels when ensuring a desired label fails', async () => {
    const api = createFakeGitHubApi();
    api.ensureLabel.mockRejectedValueOnce(new Error('permission denied'));

    const report = await applyLabelReconciliation(api, TARGET, PLAN);

    expect(api.addLabels).not.toHaveBeenCalled();
    expect(api.removeLabel).not.toHaveBeenCalled();
    expect(report.status).toBe('failed');
    expect(report.failures).toEqual([
      { action: 'ensure', label: 'type:bug', code: 'github_api_error' },
    ]);
  });

  it('reports successful removals and failed removals truthfully', async () => {
    const api = createFakeGitHubApi();
    api.removeLabel
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('rate limited'));

    const report = await applyLabelReconciliation(api, TARGET, {
      toAdd: [],
      toRemove: ['type:feature', 'jev:review-suggested'],
      unchanged: [],
    });

    expect(report.status).toBe('partial');
    expect(report.removed).toEqual(['type:feature']);
    expect(report.failures).toEqual([
      {
        action: 'remove',
        label: 'jev:review-suggested',
        code: 'github_api_error',
      },
    ]);
    expect(api.removeLabel).toHaveBeenCalledTimes(2);
    expect(vi.mocked(api.removeLabel).mock.calls[0]?.[1]).toBe('type:feature');
  });
});
