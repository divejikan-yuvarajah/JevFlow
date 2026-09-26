import type { AppConfig } from '../config/env.js';
import { getProposedLabels } from '../github/labels.js';
import { evaluateTriagePolicy } from '../policy/confidenceGate.js';
import { PolicyError } from '../policy/policy.types.js';
import { TriageError } from '../triage/triage.types.js';
import {
  EVALUATION_SCHEMA_VERSION,
  EvaluationError,
  type EvaluationAnalyzer,
  type EvaluationCaseResult,
  type EvaluationDataset,
  type EvaluationMode,
  type EvaluationReport,
  type EvaluationSuccess,
} from './evaluation.types.js';
import { calculateEvaluationSummary } from './metrics.js';

export interface RunEvaluationOptions {
  readonly dataset: EvaluationDataset;
  readonly analyzer: EvaluationAnalyzer;
  readonly mode: EvaluationMode;
  readonly config: Pick<AppConfig, 'autoThreshold' | 'reviewThreshold'>;
  readonly limit?: number;
  readonly now?: () => number;
  readonly timestamp?: () => Date;
}

function errorCode(error: unknown): string {
  if (
    error instanceof TriageError ||
    error instanceof PolicyError ||
    error instanceof EvaluationError
  ) {
    return error.code;
  }
  return 'unexpected_error';
}

function checkedDuration(started: number, completed: number): number {
  const duration = completed - started;
  return Number.isFinite(duration) && duration >= 0 ? duration : 0;
}

export async function runEvaluation(
  options: RunEvaluationOptions,
): Promise<EvaluationReport> {
  const now = options.now ?? performance.now.bind(performance);
  const timestamp = options.timestamp ?? ((): Date => new Date());
  const limit = options.limit ?? options.dataset.issues.length;
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > options.dataset.issues.length
  ) {
    throw new EvaluationError(
      'invalid_arguments',
      'Evaluation limit must be within the dataset size.',
    );
  }

  const startedAt = timestamp().toISOString();
  const cases: EvaluationCaseResult[] = [];
  const issues = options.dataset.issues.slice(0, limit);
  for (const [index, issue] of issues.entries()) {
    const caseStarted = now();
    try {
      const result = await options.analyzer(
        { title: issue.title, body: issue.body },
        { id: issue.id, index },
      );
      const plan = evaluateTriagePolicy(result, options.config);
      const proposedLabels = getProposedLabels(result, plan);
      const success: EvaluationSuccess = {
        id: issue.id,
        status: 'succeeded',
        expected: issue.expected,
        predicted: {
          issueType: result.issueType.value,
          engineeringArea: result.engineeringArea.value,
          priority: result.priority.value,
        },
        choiceEvidence: {
          issueType: {
            selectedProbability: result.issueType.selectedProbability,
            reportedConfidence: result.issueType.confidence,
          },
          engineeringArea: {
            selectedProbability: result.engineeringArea.selectedProbability,
            reportedConfidence: result.engineeringArea.confidence,
          },
          priority: {
            selectedProbability: result.priority.selectedProbability,
            reportedConfidence: result.priority.confidence,
          },
        },
        securityProbabilityYes: result.securitySensitive.probabilityYes,
        humanReviewProbabilityYes: result.needsHumanReview.probabilityYes,
        policyMode: plan.mode,
        overallChoiceGateScore: plan.overallChoiceGateScore,
        securityReviewRequested: plan.securityReviewRequested,
        reasonCodes: plan.reasonCodes,
        proposedLabels,
        evaluatorDurationMs: checkedDuration(caseStarted, now()),
        providerLatencyMs:
          options.mode === 'live-jev' ? result.meta.latencyMs : null,
      };
      cases.push(success);
    } catch (error: unknown) {
      cases.push({
        id: issue.id,
        status: 'failed',
        errorCode: errorCode(error),
        evaluatorDurationMs: checkedDuration(caseStarted, now()),
      });
    }
  }

  const completedAt = timestamp().toISOString();
  return {
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    mode: options.mode,
    provider:
      options.mode === 'live-jev' ? 'typesafe-ai-jev' : 'synthetic-fixture',
    datasetVersion: options.dataset.datasetVersion,
    datasetCount: options.dataset.issues.length,
    executedCount: cases.length,
    startedAt,
    completedAt,
    thresholds: {
      auto: options.config.autoThreshold,
      review: options.config.reviewThreshold,
    },
    summary: calculateEvaluationSummary(cases, options.mode),
    cases,
    methodology: {
      annotations: 'human-authored-synthetic',
      fixtureMeasurementsAreProviderPerformance: false,
      oneAnalyzerInvocationPerCase: true,
      providerTransportMayRetry: true,
    },
  };
}
