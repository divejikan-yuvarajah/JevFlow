import type { Environment } from '../config/env.js';
import { loadConfig } from '../config/env.js';
import { analyzeIssue } from '../triage/analyzeIssue.js';
import { createGitHubApi, type GitHubIssueApi } from '../github/client.js';
import {
  parseGitHubEvent,
  parseRepositoryIdentity,
  readGitHubEventFile,
} from '../github/eventParser.js';
import { GitHubAutomationError } from '../github/github.types.js';
import {
  runGitHubTriage,
  type GitHubIssueAnalyzer,
} from '../github/runTriage.js';
import {
  appendGitHubSummary,
  renderGitHubSummary,
  type GitHubRunSummary,
} from '../github/summary.js';

export interface GitHubActionDependencies {
  readonly readEvent?: (path: string) => Promise<unknown>;
  readonly createApi?: (token: string) => GitHubIssueApi;
  readonly analyze?: GitHubIssueAnalyzer;
  readonly appendSummary?: (path: string, markdown: string) => Promise<void>;
  readonly stdout?: (message: string) => void;
  readonly stderr?: (message: string) => void;
}

function requiredEnvironment(
  env: Environment,
  name:
    | 'GITHUB_EVENT_PATH'
    | 'GITHUB_EVENT_NAME'
    | 'GITHUB_REPOSITORY'
    | 'GITHUB_STEP_SUMMARY',
): string {
  const value = env[name]?.trim();
  if (!value) {
    throw new GitHubAutomationError(
      'invalid_environment',
      `${name} is required for GitHub issue automation.`,
    );
  }
  return value;
}

async function tryWriteFailureSummary(
  path: string | undefined,
  summary: GitHubRunSummary,
  appendSummary: (path: string, markdown: string) => Promise<void>,
): Promise<void> {
  if (!path?.trim()) return;
  try {
    await appendSummary(path, renderGitHubSummary(summary));
  } catch {
    // The caller reports a single sanitized failure below.
  }
}

export async function runGitHubAction(
  env: Environment = process.env,
  dependencies: GitHubActionDependencies = {},
): Promise<number> {
  const stdout = dependencies.stdout ?? console.log;
  const stderr = dependencies.stderr ?? console.error;
  const appendSummary = dependencies.appendSummary ?? appendGitHubSummary;
  const summaryPath = env.GITHUB_STEP_SUMMARY;

  if (env.GITHUB_ACTIONS !== 'true') {
    stderr('GitHub automation requires the guarded GitHub Actions runtime.');
    return 2;
  }

  let repository;
  try {
    repository = parseRepositoryIdentity(env.GITHUB_REPOSITORY);
    const eventPath = requiredEnvironment(env, 'GITHUB_EVENT_PATH');
    const eventName = requiredEnvironment(env, 'GITHUB_EVENT_NAME');
    const validatedSummaryPath = requiredEnvironment(
      env,
      'GITHUB_STEP_SUMMARY',
    );
    const payload = await (dependencies.readEvent ?? readGitHubEventFile)(
      eventPath,
    );
    const event = parseGitHubEvent(eventName, repository.fullName, payload);

    if (event.kind === 'skipped') {
      const summary: GitHubRunSummary = {
        status: 'skipped',
        repository,
        reason: event.reason,
      };
      await appendSummary(validatedSummaryPath, renderGitHubSummary(summary));
      stdout('JevFlow GitHub automation: skipped');
      return 0;
    }

    const token = env.GITHUB_TOKEN?.trim();
    if (!token) {
      throw new GitHubAutomationError(
        'invalid_environment',
        'GITHUB_TOKEN is required for GitHub issue automation.',
      );
    }
    const api = (
      dependencies.createApi ??
      ((value: string): GitHubIssueApi => createGitHubApi({ token: value }))
    )(token);
    const outcome = await runGitHubTriage(event, {
      api,
      analyze: dependencies.analyze ?? analyzeIssue,
      getConfig: () => loadConfig(env),
    });
    await appendSummary(
      validatedSummaryPath,
      renderGitHubSummary(outcome.summary),
    );
    stdout(`JevFlow GitHub automation: ${outcome.summary.status}`);
    return outcome.exitCode;
  } catch (error: unknown) {
    const failureCode =
      error instanceof GitHubAutomationError ? error.code : 'unexpected_error';
    await tryWriteFailureSummary(
      summaryPath,
      {
        status: 'failed',
        ...(repository === undefined ? {} : { repository }),
        failureCode,
      },
      appendSummary,
    );
    stderr(`JevFlow GitHub automation failed [${failureCode}].`);
    return 1;
  }
}
