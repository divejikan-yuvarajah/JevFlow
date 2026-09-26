import { vi } from 'vitest';

import type { GitHubIssueApi } from '../../src/github/client.js';
import type {
  IssueTarget,
  RepositoryIdentity,
} from '../../src/github/github.types.js';

export const REPOSITORY: RepositoryIdentity = {
  owner: 'example',
  repo: 'jevflow',
  fullName: 'example/jevflow',
};

export const TARGET: IssueTarget = {
  repository: REPOSITORY,
  issueNumber: 42,
};

export function createFakeGitHubApi(): {
  readonly getIssue: ReturnType<typeof vi.fn<GitHubIssueApi['getIssue']>>;
  readonly listIssueLabels: ReturnType<
    typeof vi.fn<GitHubIssueApi['listIssueLabels']>
  >;
  readonly ensureLabel: ReturnType<typeof vi.fn<GitHubIssueApi['ensureLabel']>>;
  readonly addLabels: ReturnType<typeof vi.fn<GitHubIssueApi['addLabels']>>;
  readonly removeLabel: ReturnType<typeof vi.fn<GitHubIssueApi['removeLabel']>>;
} {
  return {
    getIssue: vi.fn<GitHubIssueApi['getIssue']>().mockResolvedValue({
      title: 'Synthetic issue',
      body: 'Offline fixture body',
      issueNumber: 42,
      repository: REPOSITORY.fullName,
    }),
    listIssueLabels: vi
      .fn<GitHubIssueApi['listIssueLabels']>()
      .mockResolvedValue([]),
    ensureLabel: vi
      .fn<GitHubIssueApi['ensureLabel']>()
      .mockResolvedValue('existing'),
    addLabels: vi
      .fn<GitHubIssueApi['addLabels']>()
      .mockResolvedValue(undefined),
    removeLabel: vi
      .fn<GitHubIssueApi['removeLabel']>()
      .mockResolvedValue(undefined),
  };
}
