import type { IssueInput } from '../domain/issue.js';

export interface RepositoryIdentity {
  readonly owner: string;
  readonly repo: string;
  readonly fullName: string;
}

export interface IssueTarget {
  readonly repository: RepositoryIdentity;
  readonly issueNumber: number;
}

export interface ValidatedGitHubIssue {
  readonly target: IssueTarget;
  readonly input: IssueInput;
}

export type ParsedGitHubEvent =
  | {
      readonly kind: 'issue-opened';
      readonly issue: ValidatedGitHubIssue;
    }
  | {
      readonly kind: 'workflow-dispatch';
      readonly target: IssueTarget;
    }
  | {
      readonly kind: 'skipped';
      readonly repository: RepositoryIdentity;
      readonly reason: 'unsupported_event' | 'unsupported_action';
    };

export type GitHubAutomationErrorCode =
  | 'invalid_environment'
  | 'invalid_event'
  | 'event_too_large'
  | 'invalid_issue'
  | 'github_api_error'
  | 'invalid_label'
  | 'summary_error';

export class GitHubAutomationError extends Error {
  public readonly code: GitHubAutomationErrorCode;

  public constructor(code: GitHubAutomationErrorCode, message: string) {
    super(message);
    this.name = 'GitHubAutomationError';
    this.code = code;
  }
}
