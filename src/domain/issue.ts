/**
 * Application-level issue input. The title and body originate outside the
 * application and must be treated as untrusted input by future consumers.
 */
export interface IssueInput {
  readonly title: string;
  readonly body: string;
  readonly issueNumber?: number;
  readonly issueUrl?: string;
  readonly repository?: string;
}
