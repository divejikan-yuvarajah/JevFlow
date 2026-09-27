import { describe, expect, it, vi } from 'vitest';
import {
  handleGetIssue,
  handleListIssues,
  handleResolveRepository,
} from '@/lib/github/repository-handlers';
import type { PublicGitHubReader } from '@/lib/github/public-github-client';

const repository = {
  owner: 'Example',
  repo: 'Project',
  fullName: 'Example/Project',
  url: 'https://github.com/Example/Project',
  htmlUrl: 'https://github.com/Example/Project',
  description: null,
  defaultBranch: 'main',
  openIssueAndPullRequestCount: 1,
  hasIssues: true,
  archived: false,
  visibility: 'public' as const,
  fetchedAt: '2026-09-27T00:00:00.000Z',
};

function reader(): PublicGitHubReader {
  return {
    getRepository: vi.fn().mockResolvedValue(repository),
    listIssues: vi.fn().mockResolvedValue({ items: [], hasNextPage: false }),
    getIssue: vi.fn().mockResolvedValue({
      number: 1,
      title: 'Fixture',
      state: 'open',
      htmlUrl: 'https://github.com/Example/Project/issues/1',
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-21T10:00:00.000Z',
      labels: [],
      bodyPreview: '',
      body: '',
    }),
  };
}

describe('repository API handlers', () => {
  it('resolves only a validated public repository', async () => {
    const fake = reader();
    const response = await handleResolveRepository(
      new Request('http://local/api?repository=Example%2FProject'),
      fake,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      source: 'github-public-api',
      data: { fullName: 'Example/Project' },
    });
  });

  it('rejects invalid hosts, pagination, state, and methods before reads', async () => {
    const fake = reader();
    for (const url of [
      'http://local/api?repository=https%3A%2F%2Fevil.example%2Fa%2Fb',
      'http://local/api?repository=a%2Fb&page=11',
      'http://local/api?repository=a%2Fb&perPage=31',
      'http://local/api?repository=a%2Fb&state=pull_request',
    ]) {
      expect((await handleListIssues(new Request(url), fake)).status).toBe(400);
    }
    expect(
      (
        await handleResolveRepository(
          new Request('http://local/api?repository=a%2Fb', { method: 'POST' }),
          fake,
        )
      ).status,
    ).toBe(405);
  });

  it('returns bounded issue pages and issue details', async () => {
    const fake = reader();
    const list = await handleListIssues(
      new Request(
        'http://local/api?repository=Example%2FProject&state=all&page=1&perPage=20',
      ),
      fake,
    );
    const detail = await handleGetIssue(
      new Request('http://local/api?repository=Example%2FProject&number=1'),
      fake,
    );
    expect(list.status).toBe(200);
    expect(detail.status).toBe(200);
    expect(fake.listIssues).toHaveBeenCalledWith(
      expect.objectContaining({
        repository,
        state: 'all',
        page: 1,
        perPage: 20,
      }),
    );
    expect(fake.getIssue).toHaveBeenCalledWith(repository, 1);
  });
});
