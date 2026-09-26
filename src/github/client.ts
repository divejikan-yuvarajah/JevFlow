import { Octokit } from '@octokit/rest';

import type { IssueInput } from '../domain/issue.js';
import { buildJevState } from '../jev/state.js';
import { TriageError } from '../triage/triage.types.js';
import {
  LABEL_DEFINITIONS,
  isApprovedLabel,
  type LabelDefinition,
  type ProposedLabel,
} from './labels.js';
import {
  GitHubAutomationError,
  type IssueTarget,
  type RepositoryIdentity,
} from './github.types.js';

export type GitHubRequest = (
  route: string,
  parameters: Readonly<Record<string, unknown>>,
) => Promise<{ readonly data: unknown }>;

export interface GitHubIssueApi {
  getIssue(target: IssueTarget): Promise<IssueInput>;
  listIssueLabels(target: IssueTarget): Promise<readonly string[]>;
  ensureLabel(
    repository: RepositoryIdentity,
    definition: LabelDefinition,
  ): Promise<'existing' | 'created'>;
  addLabels(
    target: IssueTarget,
    labels: readonly ProposedLabel[],
  ): Promise<void>;
  removeLabel(target: IssueTarget, label: ProposedLabel): Promise<void>;
}

export interface CreateGitHubApiOptions {
  readonly token?: string;
  readonly request?: GitHubRequest;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function errorStatus(error: unknown): number | undefined {
  return isRecord(error) && typeof error.status === 'number'
    ? error.status
    : undefined;
}

function apiFailure(): GitHubAutomationError {
  return new GitHubAutomationError(
    'github_api_error',
    'The GitHub API operation could not be completed.',
  );
}

function assertAllowedDefinition(definition: LabelDefinition): void {
  if (!isApprovedLabel(definition.name)) {
    throw new GitHubAutomationError(
      'invalid_label',
      'A label is outside the JevFlow allowlist.',
    );
  }
  const approved = LABEL_DEFINITIONS[definition.name];
  if (
    definition.color !== approved.color ||
    definition.description !== approved.description
  ) {
    throw new GitHubAutomationError(
      'invalid_label',
      'A label definition does not match the JevFlow catalog.',
    );
  }
}

function assertAllowedLabels(
  labels: readonly string[],
): asserts labels is readonly ProposedLabel[] {
  if (labels.length === 0 || labels.some((label) => !isApprovedLabel(label))) {
    throw new GitHubAutomationError(
      'invalid_label',
      'A label is outside the JevFlow allowlist.',
    );
  }
}

function requestParameters(target: IssueTarget): {
  readonly owner: string;
  readonly repo: string;
  readonly issue_number: number;
} {
  return {
    owner: target.repository.owner,
    repo: target.repository.repo,
    issue_number: target.issueNumber,
  };
}

function parseFetchedIssue(data: unknown, target: IssueTarget): IssueInput {
  if (
    !isRecord(data) ||
    data.pull_request !== undefined ||
    data.number !== target.issueNumber ||
    typeof data.title !== 'string' ||
    (data.body !== null &&
      data.body !== undefined &&
      typeof data.body !== 'string')
  ) {
    throw new GitHubAutomationError(
      'invalid_issue',
      'The requested target is not a valid GitHub issue.',
    );
  }
  const issue: IssueInput = {
    title: data.title,
    body: typeof data.body === 'string' ? data.body : '',
    issueNumber: target.issueNumber,
    issueUrl: `https://github.com/${target.repository.fullName}/issues/${String(target.issueNumber)}`,
    repository: target.repository.fullName,
  };
  try {
    buildJevState(issue);
  } catch (error: unknown) {
    if (error instanceof TriageError) {
      throw new GitHubAutomationError(
        'invalid_issue',
        'The requested GitHub issue has invalid input.',
      );
    }
    throw error;
  }
  return issue;
}

function parseLabelPage(data: unknown): readonly string[] {
  if (!Array.isArray(data)) throw apiFailure();
  const names: string[] = [];
  for (const item of data as unknown[]) {
    if (!isRecord(item) || typeof item.name !== 'string') throw apiFailure();
    names.push(item.name);
  }
  return names;
}

function createDefaultRequest(token: string): GitHubRequest {
  const quiet = (): void => undefined;
  const client = new Octokit({
    auth: token,
    userAgent: 'jevflow/0.1.0',
    log: { debug: quiet, info: quiet, warn: quiet, error: quiet },
  });
  return async (route, parameters) => {
    const response = await client.request(route, parameters);
    return { data: response.data };
  };
}

export function createGitHubApi(
  options: CreateGitHubApiOptions,
): GitHubIssueApi {
  const token = options.token?.trim();
  if (options.request === undefined && !token) {
    throw new GitHubAutomationError(
      'invalid_environment',
      'GITHUB_TOKEN is required for GitHub issue automation.',
    );
  }
  const request = options.request ?? createDefaultRequest(token ?? '');

  return {
    async getIssue(target): Promise<IssueInput> {
      try {
        const response = await request(
          'GET /repos/{owner}/{repo}/issues/{issue_number}',
          requestParameters(target),
        );
        return parseFetchedIssue(response.data, target);
      } catch (error: unknown) {
        if (error instanceof GitHubAutomationError) throw error;
        throw apiFailure();
      }
    },

    async listIssueLabels(target): Promise<readonly string[]> {
      const labels: string[] = [];
      const seen = new Set<string>();
      try {
        for (let page = 1; page <= 10; page += 1) {
          const response = await request(
            'GET /repos/{owner}/{repo}/issues/{issue_number}/labels',
            { ...requestParameters(target), per_page: 100, page },
          );
          const names = parseLabelPage(response.data);
          for (const name of names) {
            if (!seen.has(name)) {
              labels.push(name);
              seen.add(name);
            }
          }
          if (names.length < 100) return labels;
        }
      } catch (error: unknown) {
        if (error instanceof GitHubAutomationError) throw error;
        throw apiFailure();
      }
      throw apiFailure();
    },

    async ensureLabel(repository, definition): Promise<'existing' | 'created'> {
      assertAllowedDefinition(definition);
      const parameters = {
        owner: repository.owner,
        repo: repository.repo,
        name: definition.name,
      } as const;
      try {
        await request('GET /repos/{owner}/{repo}/labels/{name}', parameters);
        return 'existing';
      } catch (error: unknown) {
        if (errorStatus(error) !== 404) throw apiFailure();
      }

      try {
        await request('POST /repos/{owner}/{repo}/labels', {
          owner: repository.owner,
          repo: repository.repo,
          name: definition.name,
          color: definition.color,
          description: definition.description,
        });
        return 'created';
      } catch (error: unknown) {
        if (errorStatus(error) !== 422) throw apiFailure();
        try {
          await request('GET /repos/{owner}/{repo}/labels/{name}', parameters);
          return 'existing';
        } catch {
          throw apiFailure();
        }
      }
    },

    async addLabels(target, labels): Promise<void> {
      assertAllowedLabels(labels);
      try {
        await request(
          'POST /repos/{owner}/{repo}/issues/{issue_number}/labels',
          { ...requestParameters(target), labels: [...labels] },
        );
      } catch {
        throw apiFailure();
      }
    },

    async removeLabel(target, label): Promise<void> {
      if (!isApprovedLabel(label)) {
        throw new GitHubAutomationError(
          'invalid_label',
          'A label is outside the JevFlow allowlist.',
        );
      }
      try {
        await request(
          'DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}',
          { ...requestParameters(target), name: label },
        );
      } catch (error: unknown) {
        if (errorStatus(error) === 404) return;
        throw apiFailure();
      }
    },
  };
}
