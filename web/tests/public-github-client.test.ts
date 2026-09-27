import { describe, expect, it, vi } from 'vitest';
import {
  createPublicGitHubReader,
  PublicGitHubError,
} from '@/lib/github/public-github-client';
import { parseRepositoryInput } from '@/lib/github/parse-repository-input';

const identity = parseRepositoryInput('Example/Project');
const repositoryPayload = {
  private: false,
  full_name: 'Example/Project',
  name: 'Project',
  owner: { login: 'Example' },
  html_url: 'https://github.com/Example/Project',
  description: 'Public example',
  default_branch: 'main',
  has_issues: true,
  archived: false,
  open_issues_count: 7,
};

function issue(number: number) {
  return {
    number,
    title: 'Synthetic issue',
    state: 'open',
    html_url: `https://github.com/Example/Project/issues/${String(number)}`,
    created_at: '2026-09-20T10:00:00Z',
    updated_at: '2026-09-21T10:00:00Z',
    labels: [{ name: 'bug', color: 'aabbcc' }],
    user: { login: 'fixture-author' },
    body: null,
  };
}

describe('public GitHub reader', () => {
  it('maps approved metadata without authorization headers', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(repositoryPayload));
    const reader = createPublicGitHubReader({
      fetch: fetcher,
      now: () => new Date('2026-09-27T00:00:00Z'),
    });
    await expect(reader.getRepository(identity)).resolves.toMatchObject({
      fullName: 'Example/Project',
      visibility: 'public',
      fetchedAt: '2026-09-27T00:00:00.000Z',
    });
    expect(fetcher).toHaveBeenCalledWith(
      'https://api.github.com/repos/Example/Project',
      expect.objectContaining({ method: 'GET', cache: 'no-store' }),
    );
    const options = fetcher.mock.calls[0]![1] as RequestInit;
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('filters pull requests, handles null bodies, and bounds pagination', async () => {
    const pull = { ...issue(2), pull_request: { url: 'ignored' } };
    const fetcher = vi.fn().mockResolvedValue(Response.json([issue(1), pull]));
    const reader = createPublicGitHubReader({ fetch: fetcher });
    const result = await reader.listIssues({
      repository: identity,
      state: 'closed',
      page: 2,
      perPage: 2,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      number: 1,
      bodyPreview: '',
      labels: [{ name: 'bug', color: 'aabbcc' }],
    });
    expect(result.hasNextPage).toBe(true);
    expect(fetcher.mock.calls[0]![0]).toBe(
      'https://api.github.com/repos/Example/Project/issues?state=closed&sort=updated&direction=desc&page=2&per_page=2',
    );
  });

  it('refuses private or malformed repository responses', async () => {
    const reader = createPublicGitHubReader({
      fetch: vi
        .fn()
        .mockResolvedValue(
          Response.json({ ...repositoryPayload, private: true }),
        ),
    });
    await expect(reader.getRepository(identity)).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it.each([
    [404, 'not_found'],
    [403, 'rate_limited'],
    [429, 'rate_limited'],
    [503, 'unavailable'],
  ])('sanitizes GitHub HTTP %s', async (status, code) => {
    const reader = createPublicGitHubReader({
      fetch: vi
        .fn()
        .mockResolvedValue(new Response('raw upstream detail', { status })),
    });
    await expect(reader.getRepository(identity)).rejects.toMatchObject({
      code,
    });
  });

  it('sanitizes timeouts and invalid JSON', async () => {
    const timeout = createPublicGitHubReader({
      fetch: vi
        .fn()
        .mockRejectedValue(new DOMException('secret', 'TimeoutError')),
    });
    await expect(timeout.getRepository(identity)).rejects.toEqual(
      expect.objectContaining({ code: 'timeout' }),
    );
    const invalid = createPublicGitHubReader({
      fetch: vi
        .fn()
        .mockResolvedValue(new Response('not-json', { status: 200 })),
    });
    const request = invalid.getRepository(identity);
    await expect(request).rejects.toBeInstanceOf(PublicGitHubError);
    await expect(request).rejects.toMatchObject({ code: 'invalid_response' });
  });
});
