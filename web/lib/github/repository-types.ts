export type PublicIssueState = 'open' | 'closed';
export type PublicIssueFilter = PublicIssueState | 'all';

export interface RepositoryIdentity {
  readonly owner: string;
  readonly repo: string;
  readonly fullName: string;
  readonly url: string;
}

export interface PublicRepository extends RepositoryIdentity {
  readonly htmlUrl: string;
  readonly description: string | null;
  readonly defaultBranch: string;
  readonly openIssueAndPullRequestCount: number;
  readonly hasIssues: boolean;
  readonly archived: boolean;
  readonly visibility: 'public';
  readonly fetchedAt: string;
}

export interface PublicIssueLabel {
  readonly name: string;
  readonly color?: string;
}

export interface PublicIssueSummary {
  readonly number: number;
  readonly title: string;
  readonly state: PublicIssueState;
  readonly htmlUrl: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly labels: readonly PublicIssueLabel[];
  readonly authorLogin?: string;
  readonly bodyPreview: string;
}

export interface PublicIssueDetail extends PublicIssueSummary {
  readonly body: string;
}

export interface PublicIssuePage {
  readonly repository: PublicRepository;
  readonly issues: readonly PublicIssueSummary[];
  readonly page: number;
  readonly perPage: number;
  readonly hasNextPage: boolean;
  readonly source: 'github-public-api';
}

export type PublicGitHubErrorCode =
  | 'invalid_request'
  | 'not_found'
  | 'rate_limited'
  | 'issues_disabled'
  | 'timeout'
  | 'unavailable'
  | 'invalid_response';

export interface PublicGitHubApiError {
  readonly ok: false;
  readonly error: {
    readonly code: PublicGitHubErrorCode;
    readonly message: string;
    readonly retryAfterSeconds?: number;
  };
}

export interface PublicGitHubApiSuccess<T> {
  readonly ok: true;
  readonly data: T;
  readonly source: 'github-public-api';
}

type ApiSuccess<T> = PublicGitHubApiSuccess<T>;

export type PublicGitHubApiResponse<T> = ApiSuccess<T> | PublicGitHubApiError;
