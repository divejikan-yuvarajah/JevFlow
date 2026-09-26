import { describe, expect, it, vi } from 'vitest';

import type { ParsedGitHubEvent } from '../../src/github/github.types.js';
import { runGitHubTriage } from '../../src/github/runTriage.js';
import { TriageError } from '../../src/triage/triage.types.js';
import { createTriageResult } from '../fixtures/triage-result.js';
import { createFakeGitHubApi, REPOSITORY, TARGET } from './helpers.js';

const OPENED_EVENT: ParsedGitHubEvent = {
  kind: 'issue-opened',
  issue: {
    target: TARGET,
    input: {
      title: 'A synthetic issue',
      body: 'Offline fixture',
      issueNumber: 42,
      issueUrl: 'https://github.com/example/jevflow/issues/42',
      repository: 'example/jevflow',
    },
  },
};

const CONFIG = { autoThreshold: 0.9, reviewThreshold: 0.75 } as const;

describe('runGitHubTriage', () => {
  it('analyzes once and uses the existing policy and label mapper', async () => {
    const api = createFakeGitHubApi();
    const analyze = vi.fn().mockResolvedValue(
      createTriageResult({
        issueType: 'bug',
        engineeringArea: 'backend',
        priority: 'high',
      }),
    );

    const outcome = await runGitHubTriage(OPENED_EVENT, {
      api,
      analyze,
      getConfig: () => CONFIG,
    });

    expect(analyze).toHaveBeenCalledOnce();
    expect(analyze).toHaveBeenCalledWith(OPENED_EVENT.issue.input);
    expect(outcome.exitCode).toBe(0);
    expect(outcome.summary.status).toBe('completed');
    expect(api.ensureLabel.mock.calls.map((call) => call[1].name)).toEqual([
      'type:bug',
      'area:backend',
      'priority:high',
      'jev:auto-triaged',
    ]);
    expect(api.addLabels).toHaveBeenCalledWith(TARGET, [
      'type:bug',
      'area:backend',
      'priority:high',
      'jev:auto-triaged',
    ]);
  });

  it('fetches current issue content before analyzing a manual dispatch', async () => {
    const api = createFakeGitHubApi();
    const analyze = vi.fn().mockResolvedValue(createTriageResult());
    const event: ParsedGitHubEvent = {
      kind: 'workflow-dispatch',
      target: TARGET,
    };

    await runGitHubTriage(event, {
      api,
      analyze,
      getConfig: () => CONFIG,
    });

    expect(api.getIssue).toHaveBeenCalledWith(TARGET);
    expect(analyze).toHaveBeenCalledWith({
      title: 'Synthetic issue',
      body: 'Offline fixture body',
      issueNumber: 42,
      repository: 'example/jevflow',
    });
  });

  it('skips unsupported events without analysis or API calls', async () => {
    const api = createFakeGitHubApi();
    const analyze = vi.fn();

    const outcome = await runGitHubTriage(
      {
        kind: 'skipped',
        repository: REPOSITORY,
        reason: 'unsupported_event',
      },
      { api, analyze, getConfig: () => CONFIG },
    );

    expect(outcome).toEqual({
      exitCode: 0,
      summary: {
        status: 'skipped',
        repository: REPOSITORY,
        reason: 'unsupported_event',
      },
    });
    expect(analyze).not.toHaveBeenCalled();
    expect(api.getIssue).not.toHaveBeenCalled();
    expect(api.listIssueLabels).not.toHaveBeenCalled();
  });

  it('does not analyze or mutate when a manual issue cannot be verified', async () => {
    const api = createFakeGitHubApi();
    api.getIssue.mockRejectedValue(
      new TriageError('invalid_input', 'untrusted provider detail'),
    );
    const analyze = vi.fn();

    const outcome = await runGitHubTriage(
      { kind: 'workflow-dispatch', target: TARGET },
      { api, analyze, getConfig: () => CONFIG },
    );

    expect(outcome.exitCode).toBe(1);
    expect(outcome.summary).toMatchObject({
      status: 'failed',
      target: TARGET,
      failureCode: 'invalid_input',
    });
    expect(analyze).not.toHaveBeenCalled();
    expect(api.listIssueLabels).not.toHaveBeenCalled();
    expect(api.addLabels).not.toHaveBeenCalled();
  });

  it('uses human-review fallback without fabricated classifications', async () => {
    const api = createFakeGitHubApi();
    api.listIssueLabels.mockResolvedValue([
      'type:feature',
      'area:security',
      'priority:high',
      'jev:auto-triaged',
      'security-review',
      'community:accepted',
    ]);
    const analyze = vi
      .fn()
      .mockRejectedValue(
        new TriageError('provider_unavailable', 'secret provider response'),
      );

    const outcome = await runGitHubTriage(OPENED_EVENT, {
      api,
      analyze,
      getConfig: () => CONFIG,
    });

    expect(outcome.exitCode).toBe(0);
    expect(outcome.summary).toMatchObject({
      status: 'human-review-fallback',
      failureCode: 'provider_unavailable',
    });
    expect(outcome.summary).not.toHaveProperty('result');
    expect(api.addLabels).toHaveBeenCalledWith(TARGET, ['jev:human-review']);
    expect(api.removeLabel).toHaveBeenCalledExactlyOnceWith(
      TARGET,
      'jev:auto-triaged',
    );
  });

  it('returns non-success when fallback labeling fails', async () => {
    const api = createFakeGitHubApi();
    api.addLabels.mockRejectedValue(new Error('permission denied'));

    const outcome = await runGitHubTriage(OPENED_EVENT, {
      api,
      analyze: vi.fn().mockRejectedValue(new Error('provider failed')),
      getConfig: () => CONFIG,
    });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.summary).toMatchObject({
      status: 'failed',
      failureCode: 'github_api_error',
      operations: {
        status: 'failed',
        added: [],
        removed: [],
        failures: [{ action: 'add', code: 'github_api_error' }],
      },
    });
  });

  it('reports a partial normal reconciliation as failed', async () => {
    const api = createFakeGitHubApi();
    api.listIssueLabels.mockResolvedValue(['jev:review-suggested']);
    api.removeLabel.mockRejectedValue(new Error('rate limit'));

    const outcome = await runGitHubTriage(OPENED_EVENT, {
      api,
      analyze: vi.fn().mockResolvedValue(createTriageResult()),
      getConfig: () => CONFIG,
    });

    expect(outcome.exitCode).toBe(1);
    expect(outcome.summary).toMatchObject({
      status: 'failed',
      failureCode: 'github_api_error',
      operations: { status: 'partial' },
    });
  });
});
