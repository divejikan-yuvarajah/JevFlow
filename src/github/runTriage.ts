import type { AppConfig } from '../config/env.js';
import type { IssueInput } from '../domain/issue.js';
import { evaluateTriagePolicy } from '../policy/confidenceGate.js';
import { PolicyError, type TriagePlan } from '../policy/policy.types.js';
import type { TriageResult } from '../triage/triage.types.js';
import { TriageError } from '../triage/triage.types.js';
import type { GitHubIssueApi } from './client.js';
import {
  GitHubAutomationError,
  type IssueTarget,
  type ParsedGitHubEvent,
} from './github.types.js';
import { getProposedLabels, type ProposedLabel } from './labels.js';
import {
  applyLabelReconciliation,
  type LabelOperationReport,
} from './issueActions.js';
import { reconcileFailureLabels, reconcileLabels } from './reconcileLabels.js';
import type { GitHubRunSummary } from './summary.js';

export type GitHubIssueAnalyzer = (issue: IssueInput) => Promise<TriageResult>;

export interface RunGitHubTriageDependencies {
  readonly api: GitHubIssueApi;
  readonly analyze: GitHubIssueAnalyzer;
  readonly getConfig: () => Pick<
    AppConfig,
    'autoThreshold' | 'reviewThreshold'
  >;
}

export interface GitHubTriageOutcome {
  readonly exitCode: 0 | 1;
  readonly summary: GitHubRunSummary;
}

function safeFailureCode(error: unknown): string {
  if (
    error instanceof TriageError ||
    error instanceof PolicyError ||
    error instanceof GitHubAutomationError
  ) {
    return error.code;
  }
  return 'unexpected_error';
}

async function applyFallback(
  target: IssueTarget,
  failureCode: string,
  api: GitHubIssueApi,
): Promise<GitHubTriageOutcome> {
  let currentLabels: readonly string[];
  try {
    currentLabels = await api.listIssueLabels(target);
  } catch {
    return {
      exitCode: 1,
      summary: { status: 'failed', target, failureCode: 'github_api_error' },
    };
  }

  let operations: LabelOperationReport;
  try {
    operations = await applyLabelReconciliation(
      api,
      target,
      reconcileFailureLabels(currentLabels),
    );
  } catch {
    return {
      exitCode: 1,
      summary: { status: 'failed', target, failureCode: 'github_api_error' },
    };
  }
  if (operations.status !== 'completed') {
    return {
      exitCode: 1,
      summary: {
        status: 'failed',
        target,
        failureCode: 'github_api_error',
        operations,
      },
    };
  }
  return {
    exitCode: 0,
    summary: {
      status: 'human-review-fallback',
      target,
      failureCode,
      operations,
    },
  };
}

export async function runGitHubTriage(
  event: ParsedGitHubEvent,
  dependencies: RunGitHubTriageDependencies,
): Promise<GitHubTriageOutcome> {
  if (event.kind === 'skipped') {
    return {
      exitCode: 0,
      summary: {
        status: 'skipped',
        repository: event.repository,
        reason: event.reason,
      },
    };
  }

  const target =
    event.kind === 'issue-opened' ? event.issue.target : event.target;
  let issue: IssueInput;
  if (event.kind === 'issue-opened') {
    issue = event.issue.input;
  } else {
    try {
      issue = await dependencies.api.getIssue(target);
    } catch (error: unknown) {
      return {
        exitCode: 1,
        summary: {
          status: 'failed',
          target,
          failureCode: safeFailureCode(error),
        },
      };
    }
  }

  let result: TriageResult;
  let plan: TriagePlan;
  let proposedLabels: readonly ProposedLabel[];
  try {
    result = await dependencies.analyze(issue);
    plan = evaluateTriagePolicy(result, dependencies.getConfig());
    proposedLabels = getProposedLabels(result, plan);
  } catch (error: unknown) {
    return applyFallback(target, safeFailureCode(error), dependencies.api);
  }

  let currentLabels: readonly string[];
  let operations: LabelOperationReport;
  try {
    currentLabels = await dependencies.api.listIssueLabels(target);
    operations = await applyLabelReconciliation(
      dependencies.api,
      target,
      reconcileLabels(currentLabels, proposedLabels),
    );
  } catch (error: unknown) {
    return {
      exitCode: 1,
      summary: {
        status: 'failed',
        target,
        failureCode: safeFailureCode(error),
        result,
        plan,
      },
    };
  }

  if (operations.status !== 'completed') {
    return {
      exitCode: 1,
      summary: {
        status: 'failed',
        target,
        failureCode: 'github_api_error',
        operations,
        result,
        plan,
      },
    };
  }
  return {
    exitCode: 0,
    summary: { status: 'completed', target, result, plan, operations },
  };
}
