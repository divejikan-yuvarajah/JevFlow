import { beforeEach, describe, expect, it } from 'vitest';
import {
  disconnectRepository,
  linkRepository,
  loadLinkedRepositories,
} from '@/lib/repositories/linked-repositories';
import {
  consumeIssueHandoff,
  saveIssueHandoff,
} from '@/lib/repositories/issue-handoff';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('linked repository preferences', () => {
  it('deduplicates case-insensitively and stores identifiers only', () => {
    linkRepository(localStorage, 'Owner/Repo');
    linkRepository(localStorage, 'owner/repo');
    expect(loadLinkedRepositories(localStorage)).toEqual(['Owner/Repo']);
    expect(
      localStorage.getItem('jevflow:linked-public-repositories'),
    ).not.toContain('token');
    expect(
      localStorage.getItem('jevflow:linked-public-repositories'),
    ).not.toContain('issue body');
  });

  it('caps repositories, tolerates corruption, and disconnects locally', () => {
    localStorage.setItem('jevflow:linked-public-repositories', '{');
    expect(loadLinkedRepositories(localStorage)).toEqual([]);
    for (let index = 1; index <= 5; index += 1)
      linkRepository(localStorage, `owner/repo-${String(index)}`);
    expect(() => linkRepository(localStorage, 'owner/repo-6')).toThrow(
      /up to 5/u,
    );
    expect(disconnectRepository(localStorage, 'OWNER/REPO-2')).not.toContain(
      'owner/repo-2',
    );
  });
});

describe('issue handoff', () => {
  it('uses bounded session storage and clears on consumption', () => {
    saveIssueHandoff(sessionStorage, 'Owner/Repo', {
      number: 3,
      title: 'Imported issue',
      state: 'open',
      htmlUrl: 'https://github.com/Owner/Repo/issues/3',
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-21T10:00:00.000Z',
      labels: [],
      bodyPreview: 'Body',
      body: 'Body',
    });
    expect(consumeIssueHandoff(sessionStorage)).toMatchObject({
      repository: 'Owner/Repo',
      number: 3,
      title: 'Imported issue',
    });
    expect(consumeIssueHandoff(sessionStorage)).toBeNull();
  });
});
