import { appendFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';

import type { TriagePlan } from '../policy/policy.types.js';
import type { ChoiceDecision, TriageResult } from '../triage/triage.types.js';
import {
  GitHubAutomationError,
  type IssueTarget,
  type RepositoryIdentity,
} from './github.types.js';
import type { LabelOperationReport } from './issueActions.js';

export type GitHubRunSummary =
  | {
      readonly status: 'completed';
      readonly target: IssueTarget;
      readonly result: TriageResult;
      readonly plan: TriagePlan;
      readonly operations: LabelOperationReport;
    }
  | {
      readonly status: 'human-review-fallback';
      readonly target: IssueTarget;
      readonly failureCode: string;
      readonly operations: LabelOperationReport;
    }
  | {
      readonly status: 'failed';
      readonly target?: IssueTarget;
      readonly repository?: RepositoryIdentity;
      readonly failureCode: string;
      readonly operations?: LabelOperationReport;
      readonly result?: TriageResult;
      readonly plan?: TriagePlan;
    }
  | {
      readonly status: 'skipped';
      readonly repository: RepositoryIdentity;
      readonly reason: 'unsupported_event' | 'unsupported_action';
    };

function escapeMarkdown(value: string): string {
  return value
    .replaceAll('\r', ' ')
    .replaceAll('\n', ' ')
    .replaceAll('\\', '\\\\')
    .replaceAll('|', '\\|')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('*', '\\*')
    .replaceAll('_', '\\_')
    .replaceAll('`', '\\`')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('!', '\\!')
    .replaceAll('#', '\\#');
}

function formatProbability(value: number): string {
  return value.toFixed(3);
}

function formatChoiceRow(
  label: string,
  choice: ChoiceDecision<string>,
): string {
  return `| ${label} | ${escapeMarkdown(choice.value)} | ${formatProbability(choice.selectedProbability)} | ${formatProbability(choice.confidence)} |`;
}

function formatLabels(labels: readonly string[]): string {
  if (labels.length === 0) return 'none';
  const visible = labels.slice(0, 20).map(escapeMarkdown).join(', ');
  return labels.length > 20 ? `${visible}, …` : visible;
}

function formatFailures(report: LabelOperationReport): string {
  if (report.failures.length === 0) return 'none';
  return report.failures
    .map((failure) =>
      failure.label === undefined
        ? failure.action
        : `${failure.action}:${escapeMarkdown(failure.label)}`,
    )
    .join(', ');
}

function operationLines(report: LabelOperationReport): readonly string[] {
  return [
    `- Operation status: ${report.status}`,
    `- Created catalog labels: ${formatLabels(report.created)}`,
    `- Added: ${formatLabels(report.added)}`,
    `- Removed: ${formatLabels(report.removed)}`,
    `- Preserved/unchanged: ${formatLabels(report.unchanged)}`,
    `- Failed operations: ${formatFailures(report)}`,
  ];
}

function issueLine(target: IssueTarget): string {
  const repository = escapeMarkdown(target.repository.fullName);
  const issueNumber = String(target.issueNumber);
  const url = `https://github.com/${target.repository.fullName}/issues/${issueNumber}`;
  return `Issue: [${repository}#${issueNumber}](${url})`;
}

function decisionLines(
  result: TriageResult,
  plan: TriagePlan,
): readonly string[] {
  return [
    '| Decision | Selected | P(selected) | Reported confidence |',
    '| --- | --- | ---: | ---: |',
    formatChoiceRow('Issue type', result.issueType),
    formatChoiceRow('Engineering area', result.engineeringArea),
    formatChoiceRow('Priority', result.priority),
    '',
    `Security sensitive P(YES): ${formatProbability(result.securitySensitive.probabilityYes)}`,
    `Needs human review P(YES): ${formatProbability(result.needsHumanReview.probabilityYes)}`,
    `Policy mode: ${plan.mode}`,
    `Choice gate score: ${formatProbability(plan.overallChoiceGateScore)}`,
    `Reason codes: ${plan.reasonCodes.map(escapeMarkdown).join(', ')}`,
    `Provider latency: ${result.meta.latencyMs.toFixed(1)} ms`,
    '',
    '> `security-review` requests investigation; it does not confirm a vulnerability.',
  ];
}

export function renderGitHubSummary(summary: GitHubRunSummary): string {
  const lines = ['# JevFlow Triage', ''];
  if (summary.status === 'skipped') {
    lines.push(
      `Repository: ${escapeMarkdown(summary.repository.fullName)}`,
      'Run status: Skipped',
      `Reason: ${summary.reason}`,
    );
    return `${lines.join('\n')}\n`;
  }

  if (summary.target !== undefined) lines.push(issueLine(summary.target));
  else if (summary.status === 'failed' && summary.repository !== undefined) {
    lines.push(`Repository: ${escapeMarkdown(summary.repository.fullName)}`);
  }

  if (summary.status === 'completed') {
    lines.push(
      'Run status: Completed',
      '',
      ...decisionLines(summary.result, summary.plan),
      '',
      '## Label changes',
      ...operationLines(summary.operations),
    );
  } else if (summary.status === 'human-review-fallback') {
    lines.push(
      'Run status: Human review fallback',
      `Failure code: ${escapeMarkdown(summary.failureCode)}`,
      '',
      'No classifications or probabilities were fabricated.',
      '',
      '## Label changes',
      ...operationLines(summary.operations),
    );
  } else {
    lines.push(
      'Run status: Failed',
      `Failure code: ${escapeMarkdown(summary.failureCode)}`,
    );
    if (summary.result !== undefined && summary.plan !== undefined) {
      lines.push('', ...decisionLines(summary.result, summary.plan));
    }
    if (summary.operations !== undefined) {
      lines.push('', '## Label changes', ...operationLines(summary.operations));
    }
  }

  return `${lines.join('\n')}\n`;
}

export async function appendGitHubSummary(
  path: string,
  markdown: string,
): Promise<void> {
  if (!isAbsolute(path) || path.trim() === '' || markdown.length > 64 * 1024) {
    throw new GitHubAutomationError(
      'summary_error',
      'Invalid GitHub step summary destination.',
    );
  }
  try {
    await appendFile(path, markdown, { encoding: 'utf8' });
  } catch {
    throw new GitHubAutomationError(
      'summary_error',
      'GitHub step summary could not be written.',
    );
  }
}
