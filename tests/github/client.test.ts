import { describe, expect, it, vi } from 'vitest';

import {
  createGitHubApi,
  type GitHubRequest,
} from '../../src/github/client.js';
import { GitHubAutomationError } from '../../src/github/github.types.js';
import { LABEL_DEFINITIONS } from '../../src/github/labels.js';
import { REPOSITORY, TARGET } from './helpers.js';

function response(data: unknown): { readonly data: unknown } {
  return { data };
}

describe('createGitHubApi', () => {
  it('fetches the current issue and derives trusted identity fields', async () => {
    const request = vi
      .fn<GitHubRequest>()
      .mockResolvedValue(
        response({ number: 42, title: 'Current title', body: null }),
      );
    const api = createGitHubApi({ request });

    await expect(api.getIssue(TARGET)).resolves.toEqual({
      title: 'Current title',
      body: '',
      issueNumber: 42,
      issueUrl: 'https://github.com/example/jevflow/issues/42',
      repository: 'example/jevflow',
    });
    expect(request).toHaveBeenCalledWith(
      'GET /repos/{owner}/{repo}/issues/{issue_number}',
      { owner: 'example', repo: 'jevflow', issue_number: 42 },
    );
  });

  it('rejects pull-request-shaped issue API responses', async () => {
    const request = vi.fn<GitHubRequest>().mockResolvedValue(
      response({
        number: 42,
        title: 'Pull request',
        body: 'body',
        pull_request: { url: 'https://api.github.test/pr/42' },
      }),
    );
    const api = createGitHubApi({ request });

    await expect(api.getIssue(TARGET)).rejects.toMatchObject({
      code: 'invalid_issue',
    });
  });

  it('paginates labels and removes duplicate names', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      name: index === 99 ? 'duplicate' : `label-${String(index)}`,
    }));
    const request = vi
      .fn<GitHubRequest>()
      .mockResolvedValueOnce(response(firstPage))
      .mockResolvedValueOnce(
        response([{ name: 'duplicate' }, { name: 'last' }]),
      );
    const api = createGitHubApi({ request });

    const labels = await api.listIssueLabels(TARGET);

    expect(labels).toHaveLength(101);
    expect(labels.slice(-2)).toEqual(['duplicate', 'last']);
    expect(request).toHaveBeenNthCalledWith(
      2,
      'GET /repos/{owner}/{repo}/issues/{issue_number}/labels',
      {
        owner: 'example',
        repo: 'jevflow',
        issue_number: 42,
        per_page: 100,
        page: 2,
      },
    );
  });

  it('creates an absent approved label and tolerates a creation race', async () => {
    const missing = Object.assign(new Error('not found'), { status: 404 });
    const conflict = Object.assign(new Error('already exists'), {
      status: 422,
    });
    const createRequest = vi
      .fn<GitHubRequest>()
      .mockRejectedValueOnce(missing)
      .mockResolvedValueOnce(response({ name: 'type:bug' }));
    const raceRequest = vi
      .fn<GitHubRequest>()
      .mockRejectedValueOnce(missing)
      .mockRejectedValueOnce(conflict)
      .mockResolvedValueOnce(response({ name: 'type:bug' }));

    await expect(
      createGitHubApi({ request: createRequest }).ensureLabel(
        REPOSITORY,
        LABEL_DEFINITIONS['type:bug'],
      ),
    ).resolves.toBe('created');
    await expect(
      createGitHubApi({ request: raceRequest }).ensureLabel(
        REPOSITORY,
        LABEL_DEFINITIONS['type:bug'],
      ),
    ).resolves.toBe('existing');
  });

  it('blocks arbitrary labels before issuing a mutation request', async () => {
    const request = vi.fn<GitHubRequest>();
    const api = createGitHubApi({ request });

    await expect(
      api.addLabels(TARGET, ['attacker:label'] as never),
    ).rejects.toBeInstanceOf(GitHubAutomationError);
    expect(request).not.toHaveBeenCalled();
  });

  it('turns provider errors into a sanitized stable error', async () => {
    const request = vi
      .fn<GitHubRequest>()
      .mockRejectedValue(new Error('sensitive credential value: rate limited'));
    const api = createGitHubApi({ request });

    await expect(api.listIssueLabels(TARGET)).rejects.toMatchObject({
      code: 'github_api_error',
      message: 'The GitHub API operation could not be completed.',
    });
  });

  it('treats remove-label 404 as an idempotent success', async () => {
    const request = vi
      .fn<GitHubRequest>()
      .mockRejectedValue(Object.assign(new Error('missing'), { status: 404 }));
    const api = createGitHubApi({ request });

    await expect(
      api.removeLabel(TARGET, 'jev:review-suggested'),
    ).resolves.toBeUndefined();
  });
});
