import { describe, expect, it, vi } from 'vitest';

import type { Environment } from '../../src/config/env.js';
import { runGitHubAction } from '../../src/cli/github-action.js';
import { createTriageResult } from '../fixtures/triage-result.js';
import { createFakeGitHubApi } from './helpers.js';

const BASE_ENV: Environment = {
  GITHUB_ACTIONS: 'true',
  GITHUB_EVENT_PATH: 'C:\\runner\\event.json',
  GITHUB_EVENT_NAME: 'issues',
  GITHUB_REPOSITORY: 'example/jevflow',
  GITHUB_STEP_SUMMARY: 'C:\\runner\\summary.md',
};

describe('runGitHubAction', () => {
  it('refuses to run outside GitHub Actions before reading input', async () => {
    const readEvent = vi.fn();
    const stderr = vi.fn();

    await expect(runGitHubAction({}, { readEvent, stderr })).resolves.toBe(2);
    expect(readEvent).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledWith(
      'GitHub automation requires the guarded GitHub Actions runtime.',
    );
  });

  it('skips unsupported events without credentials, API, or analysis', async () => {
    const appendSummary = vi.fn().mockResolvedValue(undefined);
    const createApi = vi.fn();
    const analyze = vi.fn();

    const exitCode = await runGitHubAction(
      { ...BASE_ENV, GITHUB_EVENT_NAME: 'push' },
      {
        readEvent: vi
          .fn()
          .mockResolvedValue({ repository: { full_name: 'example/jevflow' } }),
        appendSummary,
        createApi,
        analyze,
        stdout: vi.fn(),
      },
    );

    expect(exitCode).toBe(0);
    expect(createApi).not.toHaveBeenCalled();
    expect(analyze).not.toHaveBeenCalled();
    expect(appendSummary.mock.calls[0]?.[1]).toContain('Run status: Skipped');
  });

  it('runs a validated event using injected offline dependencies', async () => {
    const api = createFakeGitHubApi();
    const appendSummary = vi.fn().mockResolvedValue(undefined);
    const analyze = vi.fn().mockResolvedValue(createTriageResult());

    const exitCode = await runGitHubAction(
      { ...BASE_ENV, GITHUB_TOKEN: 'offline-placeholder' },
      {
        readEvent: vi.fn().mockResolvedValue({
          action: 'opened',
          repository: { full_name: 'example/jevflow' },
          issue: { number: 42, title: 'Offline title', body: 'Offline body' },
        }),
        createApi: vi.fn().mockReturnValue(api),
        analyze,
        appendSummary,
        stdout: vi.fn(),
      },
    );

    expect(exitCode).toBe(0);
    expect(analyze).toHaveBeenCalledOnce();
    expect(appendSummary.mock.calls[0]?.[1]).toContain('Run status: Completed');
  });

  it('does not create an API client when repository identity is invalid', async () => {
    const createApi = vi.fn();
    const appendSummary = vi.fn().mockResolvedValue(undefined);
    const stderr = vi.fn();

    const exitCode = await runGitHubAction(
      { ...BASE_ENV, GITHUB_REPOSITORY: '../wrong' },
      { createApi, appendSummary, stderr },
    );

    expect(exitCode).toBe(1);
    expect(createApi).not.toHaveBeenCalled();
    expect(appendSummary.mock.calls[0]?.[1]).toContain(
      'Failure code: invalid\\_environment',
    );
    expect(stderr).toHaveBeenCalledWith(
      'JevFlow GitHub automation failed [invalid_environment].',
    );
  });

  it('sanitizes unexpected event reader failures', async () => {
    const appendSummary = vi.fn().mockResolvedValue(undefined);
    const stderr = vi.fn();

    const exitCode = await runGitHubAction(BASE_ENV, {
      readEvent: vi.fn().mockRejectedValue(new Error('token=secret-value')),
      appendSummary,
      stderr,
    });

    expect(exitCode).toBe(1);
    const markdown = String(appendSummary.mock.calls[0]?.[1]);
    expect(markdown).toContain('Failure code: unexpected\\_error');
    expect(markdown).not.toContain('secret-value');
    expect(stderr.mock.calls.flat().join(' ')).not.toContain('secret-value');
  });
});
