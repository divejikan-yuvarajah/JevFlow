import 'server-only';

import { parseRepositoryInput } from './parse-repository-input';
import {
  GitHubMappingError,
  mapIssueDetail,
  mapIssueList,
  mapPublicRepository,
} from './repository-mapper';
import type {
  PublicIssueDetail,
  PublicIssueFilter,
  PublicIssueSummary,
  PublicRepository,
  RepositoryIdentity,
} from './repository-types';

const API_ORIGIN = 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 8_000;

export class PublicGitHubError extends Error {
  public constructor(
    public readonly code:
      | 'not_found'
      | 'rate_limited'
      | 'timeout'
      | 'unavailable'
      | 'invalid_response'
      | 'issues_disabled',
    message: string,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'PublicGitHubError';
  }
}

export interface IssueListRequest {
  readonly repository: RepositoryIdentity;
  readonly state: PublicIssueFilter;
  readonly page: number;
  readonly perPage: number;
}

export interface IssueListResult {
  readonly items: readonly PublicIssueSummary[];
  readonly hasNextPage: boolean;
}

export interface PublicGitHubReader {
  getRepository(repository: RepositoryIdentity): Promise<PublicRepository>;
  listIssues(request: IssueListRequest): Promise<IssueListResult>;
  getIssue(
    repository: RepositoryIdentity,
    issueNumber: number,
  ): Promise<PublicIssueDetail>;
}

export interface PublicGitHubReaderOptions {
  readonly fetch?: typeof fetch;
  readonly now?: () => Date;
}

function retryAfter(response: Response): number | undefined {
  const seconds = Number(response.headers.get('retry-after'));
  if (Number.isSafeInteger(seconds) && seconds >= 0 && seconds <= 86_400) {
    return seconds;
  }
  const reset = Number(response.headers.get('x-ratelimit-reset'));
  if (Number.isSafeInteger(reset) && reset > 0) {
    return Math.min(86_400, Math.max(0, reset - Math.floor(Date.now() / 1000)));
  }
  return undefined;
}

async function requestJson(
  fetcher: typeof fetch,
  path: string,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(`${API_ORIGIN}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'JevFlow-connected-repositories',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'TimeoutError'
    ) {
      throw new PublicGitHubError(
        'timeout',
        'GitHub did not respond before the request timed out.',
      );
    }
    throw new PublicGitHubError(
      'unavailable',
      'GitHub is temporarily unavailable. Try again later.',
    );
  }
  if (response.status === 404) {
    throw new PublicGitHubError(
      'not_found',
      'The repository or issue was not found, is private, or is inaccessible.',
    );
  }
  if (response.status === 403 || response.status === 429) {
    throw new PublicGitHubError(
      'rate_limited',
      'GitHub public API access is rate limited. Try again later.',
      retryAfter(response),
    );
  }
  if (!response.ok) {
    throw new PublicGitHubError(
      'unavailable',
      'GitHub could not complete the public read request.',
    );
  }
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new PublicGitHubError(
      'invalid_response',
      'GitHub returned an unreadable response.',
    );
  }
}

function repositoryPath(repository: RepositoryIdentity): string {
  return `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`;
}

export function createPublicGitHubReader(
  options: PublicGitHubReaderOptions = {},
): PublicGitHubReader {
  const fetcher = options.fetch ?? fetch;
  const now = options.now ?? (() => new Date());
  return {
    async getRepository(repository) {
      try {
        return mapPublicRepository(
          await requestJson(fetcher, repositoryPath(repository)),
          now(),
        );
      } catch (error: unknown) {
        if (error instanceof PublicGitHubError) throw error;
        if (error instanceof GitHubMappingError) {
          throw new PublicGitHubError('invalid_response', error.message);
        }
        throw error;
      }
    },
    async listIssues({ repository, state, page, perPage }) {
      const path = `${repositoryPath(repository)}/issues?state=${state}&sort=updated&direction=desc&page=${String(page)}&per_page=${String(perPage)}`;
      try {
        const raw = await requestJson(fetcher, path);
        if (!Array.isArray(raw)) throw new GitHubMappingError();
        return {
          items: mapIssueList(raw, repository.fullName),
          hasNextPage: raw.length === perPage,
        };
      } catch (error: unknown) {
        if (error instanceof PublicGitHubError) throw error;
        if (error instanceof GitHubMappingError) {
          throw new PublicGitHubError('invalid_response', error.message);
        }
        throw error;
      }
    },
    async getIssue(repository, issueNumber) {
      try {
        return mapIssueDetail(
          await requestJson(
            fetcher,
            `${repositoryPath(repository)}/issues/${String(issueNumber)}`,
          ),
          repository.fullName,
        );
      } catch (error: unknown) {
        if (error instanceof PublicGitHubError) throw error;
        if (error instanceof GitHubMappingError) {
          throw new PublicGitHubError('invalid_response', error.message);
        }
        throw error;
      }
    },
  };
}

export function parsePublicRepository(value: unknown): RepositoryIdentity {
  return parseRepositoryInput(value);
}
