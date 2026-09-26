import { describe, expect, it, vi } from 'vitest';

import {
  MAX_GITHUB_EVENT_BYTES,
  parseDispatchIssueNumber,
  parseGitHubEvent,
  parseRepositoryIdentity,
  readGitHubEventFile,
  type EventFileAccess,
} from '../../src/github/eventParser.js';
import { GitHubAutomationError } from '../../src/github/github.types.js';

function issueEvent(overrides: Record<string, unknown> = {}): unknown {
  return {
    action: 'opened',
    repository: { full_name: 'example/jevflow' },
    issue: {
      number: 42,
      title: 'Unicode failure 🧪',
      body: null,
    },
    ...overrides,
  };
}

describe('GitHub event parsing', () => {
  it('validates an issues.opened payload and converts a null body', () => {
    const parsed = parseGitHubEvent('issues', 'example/jevflow', issueEvent());
    expect(parsed).toEqual({
      kind: 'issue-opened',
      issue: {
        target: {
          repository: {
            owner: 'example',
            repo: 'jevflow',
            fullName: 'example/jevflow',
          },
          issueNumber: 42,
        },
        input: {
          title: 'Unicode failure 🧪',
          body: '',
          issueNumber: 42,
          issueUrl: 'https://github.com/example/jevflow/issues/42',
          repository: 'example/jevflow',
        },
      },
    });
  });

  it('keeps hostile text as issue data without changing identity', () => {
    const hostile = '](https://attacker.invalid) ${{ secrets.GITHUB_TOKEN }}';
    const parsed = parseGitHubEvent(
      'issues',
      'example/jevflow',
      issueEvent({
        issue: { number: 42, title: hostile, body: hostile },
      }),
    );
    expect(parsed.kind).toBe('issue-opened');
    if (parsed.kind === 'issue-opened') {
      expect(parsed.issue.input.title).toBe(hostile);
      expect(parsed.issue.target.repository.fullName).toBe('example/jevflow');
    }
  });

  it('parses workflow dispatch using the runner repository', () => {
    expect(
      parseGitHubEvent('workflow_dispatch', 'example/jevflow', {
        repository: { full_name: 'example/jevflow' },
        inputs: { issue_number: '42' },
      }),
    ).toMatchObject({
      kind: 'workflow-dispatch',
      target: { issueNumber: 42 },
    });
  });

  it.each(['', '0', '-1', '1.5', ' 2', '+2', '9007199254740992'])(
    'rejects invalid dispatch number %s',
    (value) => {
      expect(() => parseDispatchIssueNumber(value)).toThrow(
        GitHubAutomationError,
      );
    },
  );

  it.each([
    '',
    'missing-slash',
    '-owner/repo',
    'owner-/repo',
    'owner/..',
    'owner/repo.',
  ])('rejects invalid repository identity %s', (value) => {
    expect(() => parseRepositoryIdentity(value)).toThrow(GitHubAutomationError);
  });

  it('rejects mismatched repositories and pull-request-shaped issues', () => {
    expect(() =>
      parseGitHubEvent(
        'issues',
        'example/jevflow',
        issueEvent({ repository: { full_name: 'attacker/repo' } }),
      ),
    ).toThrow('does not match');
    expect(() =>
      parseGitHubEvent(
        'issues',
        'example/jevflow',
        issueEvent({
          issue: {
            number: 42,
            title: 'PR',
            body: '',
            pull_request: {},
          },
        }),
      ),
    ).toThrow('GitHub issue');
  });

  it('skips unsupported events and issue actions', () => {
    expect(parseGitHubEvent('push', 'example/jevflow', {})).toMatchObject({
      kind: 'skipped',
      reason: 'unsupported_event',
    });
    expect(
      parseGitHubEvent('issues', 'example/jevflow', { action: 'edited' }),
    ).toMatchObject({ kind: 'skipped', reason: 'unsupported_action' });
  });
});

describe('readGitHubEventFile', () => {
  it('reads bounded JSON', async () => {
    const text = JSON.stringify({ action: 'opened' });
    const access: EventFileAccess = {
      getSize: vi.fn().mockResolvedValue(Buffer.byteLength(text)),
      readText: vi.fn().mockResolvedValue(text),
    };
    await expect(readGitHubEventFile('event.json', access)).resolves.toEqual({
      action: 'opened',
    });
  });

  it('rejects oversized content before and after reading', async () => {
    const readText = vi.fn().mockResolvedValue('{}');
    await expect(
      readGitHubEventFile('event.json', {
        getSize: vi.fn().mockResolvedValue(MAX_GITHUB_EVENT_BYTES + 1),
        readText,
      }),
    ).rejects.toMatchObject({ code: 'event_too_large' });
    expect(readText).not.toHaveBeenCalled();

    await expect(
      readGitHubEventFile('event.json', {
        getSize: vi.fn().mockResolvedValue(2),
        readText: vi
          .fn()
          .mockResolvedValue('x'.repeat(MAX_GITHUB_EVENT_BYTES + 1)),
      }),
    ).rejects.toMatchObject({ code: 'event_too_large' });
  });

  it('rejects malformed JSON without echoing it', async () => {
    const secret = 'malicious-secret-text';
    const access: EventFileAccess = {
      getSize: vi.fn().mockResolvedValue(secret.length),
      readText: vi.fn().mockResolvedValue(secret),
    };
    try {
      await readGitHubEventFile('event.json', access);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(GitHubAutomationError);
      expect(String(error)).not.toContain(secret);
    }
  });
});
