import type { IssueInput } from '../domain/issue.js';
import type { ProposedLabel } from '../github/labels.js';
import type { TriagePlan } from '../policy/policy.types.js';
import type { ChoiceDecision, TriageResult } from '../triage/triage.types.js';

interface ReportChoice<T extends string> {
  readonly value: T;
  readonly selectedProbability: number;
  readonly confidence: number;
}

export interface TriageCliReport {
  readonly issueNumber?: number;
  readonly classification: {
    readonly issueType: ReportChoice<TriageResult['issueType']['value']>;
    readonly engineeringArea: ReportChoice<
      TriageResult['engineeringArea']['value']
    >;
    readonly priority: ReportChoice<TriageResult['priority']['value']>;
    readonly securitySensitiveProbabilityYes: number;
    readonly needsHumanReviewProbabilityYes: number;
  };
  readonly policy: TriagePlan;
  readonly proposedLabels: readonly ProposedLabel[];
  readonly meta: TriageResult['meta'];
}

function reportChoice<T extends string>(
  decision: ChoiceDecision<T>,
): ReportChoice<T> {
  return {
    value: decision.value,
    selectedProbability: decision.selectedProbability,
    confidence: decision.confidence,
  };
}

export function buildTriageReport(
  issue: IssueInput,
  result: TriageResult,
  plan: TriagePlan,
  proposedLabels: readonly ProposedLabel[],
): TriageCliReport {
  return {
    ...(issue.issueNumber === undefined
      ? {}
      : { issueNumber: issue.issueNumber }),
    classification: {
      issueType: reportChoice(result.issueType),
      engineeringArea: reportChoice(result.engineeringArea),
      priority: reportChoice(result.priority),
      securitySensitiveProbabilityYes: result.securitySensitive.probabilityYes,
      needsHumanReviewProbabilityYes: result.needsHumanReview.probabilityYes,
    },
    policy: plan,
    proposedLabels,
    meta: result.meta,
  };
}

function formatChoice(label: string, choice: ReportChoice<string>): string {
  return `${label}: ${choice.value} (selected probability: ${choice.selectedProbability.toFixed(3)}, reported confidence: ${choice.confidence.toFixed(3)})`;
}

export function formatHumanReport(report: TriageCliReport): string {
  return [
    'JevFlow local triage result',
    `Issue: ${report.issueNumber === undefined ? 'not provided' : `#${String(report.issueNumber)}`}`,
    formatChoice('Issue type', report.classification.issueType),
    formatChoice('Engineering area', report.classification.engineeringArea),
    formatChoice('Priority', report.classification.priority),
    `Security sensitive P(YES): ${report.classification.securitySensitiveProbabilityYes.toFixed(3)}`,
    `Needs human review P(YES): ${report.classification.needsHumanReviewProbabilityYes.toFixed(3)}`,
    `Overall choice gate score: ${report.policy.overallChoiceGateScore.toFixed(3)}`,
    `Mode: ${report.policy.mode}`,
    `Reasons: ${report.policy.reasonCodes.join(', ')}`,
    `Proposed labels: ${report.proposedLabels.join(', ')}`,
    `Provider latency: ${report.meta.latencyMs.toFixed(1)} ms`,
  ].join('\n');
}

export function formatJsonReport(report: TriageCliReport): string {
  return JSON.stringify(report, null, 2);
}
