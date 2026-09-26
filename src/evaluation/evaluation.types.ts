import type {
  AutomationMode,
  EngineeringArea,
  IssuePriority,
  IssueType,
} from '../domain/constants.js';
import type { IssueInput } from '../domain/issue.js';
import type { ProposedLabel } from '../github/labels.js';
import type { PolicyReasonCode } from '../policy/policy.types.js';
import type { TriageResult } from '../triage/triage.types.js';

export const EVALUATION_SCHEMA_VERSION = '1.0' as const;
export const EVALUATION_DATASET_SIZE = 30;

export type AnnotationConfidence = 'high' | 'medium' | 'low';
export type EvaluationMode = 'offline-fixture' | 'live-jev';

export interface EvaluationExpectation {
  readonly issueType: IssueType;
  readonly engineeringArea: EngineeringArea;
  readonly priority: IssuePriority;
  readonly securitySensitive: boolean;
  readonly needsHumanReview: boolean;
  readonly acceptableAlternativeAreas?: readonly EngineeringArea[];
  readonly annotationConfidence: AnnotationConfidence;
  readonly rationale: string;
}

export interface EvaluationIssue {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly expected: EvaluationExpectation;
}

export interface EvaluationDataset {
  readonly schemaVersion: typeof EVALUATION_SCHEMA_VERSION;
  readonly datasetVersion: string;
  readonly description: string;
  readonly issues: readonly EvaluationIssue[];
}

export interface FixtureChoice<T extends string> {
  readonly value: T;
  readonly selectedProbability: number;
  readonly confidence: number;
}

export interface NormalizedDecisionFixture {
  readonly id: string;
  readonly issueType: FixtureChoice<IssueType>;
  readonly engineeringArea: FixtureChoice<EngineeringArea>;
  readonly priority: FixtureChoice<IssuePriority>;
  readonly securityProbabilityYes: number;
  readonly humanReviewProbabilityYes: number;
  readonly inputTruncated: boolean;
}

export interface FixtureDataset {
  readonly schemaVersion: typeof EVALUATION_SCHEMA_VERSION;
  readonly datasetVersion: string;
  readonly provider: 'synthetic-fixture';
  readonly description: string;
  readonly fixtures: readonly NormalizedDecisionFixture[];
}

export interface EvaluationAnalyzerContext {
  readonly id: string;
  readonly index: number;
}

export type EvaluationAnalyzer = (
  issue: IssueInput,
  context: EvaluationAnalyzerContext,
) => Promise<TriageResult>;

export interface EvaluationPrediction {
  readonly issueType: IssueType;
  readonly engineeringArea: EngineeringArea;
  readonly priority: IssuePriority;
}

export interface ChoiceEvidence {
  readonly issueType: {
    readonly selectedProbability: number;
    readonly reportedConfidence: number;
  };
  readonly engineeringArea: {
    readonly selectedProbability: number;
    readonly reportedConfidence: number;
  };
  readonly priority: {
    readonly selectedProbability: number;
    readonly reportedConfidence: number;
  };
}

export interface EvaluationSuccess {
  readonly id: string;
  readonly status: 'succeeded';
  readonly expected: EvaluationExpectation;
  readonly predicted: EvaluationPrediction;
  readonly choiceEvidence: ChoiceEvidence;
  readonly securityProbabilityYes: number;
  readonly humanReviewProbabilityYes: number;
  readonly policyMode: AutomationMode;
  readonly overallChoiceGateScore: number;
  readonly securityReviewRequested: boolean;
  readonly reasonCodes: readonly PolicyReasonCode[];
  readonly proposedLabels: readonly ProposedLabel[];
  readonly evaluatorDurationMs: number;
  readonly providerLatencyMs: number | null;
}

export interface EvaluationFailure {
  readonly id: string;
  readonly status: 'failed';
  readonly errorCode: string;
  readonly evaluatorDurationMs: number;
}

export type EvaluationCaseResult = EvaluationSuccess | EvaluationFailure;

export interface RatioMetric {
  readonly numerator: number;
  readonly denominator: number;
  readonly rate: number | null;
}

export interface ClassificationDimensionMetrics {
  readonly strictAccuracy: RatioMetric;
  readonly confusionMatrix: Readonly<
    Record<string, Readonly<Record<string, number>>>
  >;
}

export interface ClassificationMetrics {
  readonly issueType: ClassificationDimensionMetrics;
  readonly engineeringArea: ClassificationDimensionMetrics & {
    readonly acceptableAnswerAccuracy: RatioMetric;
  };
  readonly priority: ClassificationDimensionMetrics;
  readonly exactAllThreeAccuracy: RatioMetric;
}

export interface DistributionStats {
  readonly count: number;
  readonly average: number | null;
  readonly median: number | null;
  readonly p95: number | null;
}

export interface ProbabilityDimensionMetrics {
  readonly selectedProbability: DistributionStats;
  readonly reportedConfidence: DistributionStats;
}

export interface BinaryProbabilityMetrics {
  readonly all: DistributionStats;
  readonly annotatedYes: DistributionStats;
  readonly annotatedNo: DistributionStats;
}

export interface GateScoreBin {
  readonly label: string;
  readonly lowerInclusive: number;
  readonly upperExclusive: number | null;
  readonly count: number;
  readonly exactAllThreeCorrect: number;
  readonly observedExactAccuracy: number | null;
}

export interface EvaluationSummary {
  readonly accounting: {
    readonly total: number;
    readonly succeeded: number;
    readonly failed: number;
    readonly skipped: 0;
    readonly completionRate: RatioMetric;
    readonly failuresByCode: Readonly<Record<string, number>>;
  };
  readonly classification: ClassificationMetrics;
  readonly automation: {
    readonly autoCount: number;
    readonly reviewSuggestedCount: number;
    readonly humanReviewCount: number;
    readonly autoProportion: RatioMetric;
    readonly reviewSuggestedProportion: RatioMetric;
    readonly humanReviewProportion: RatioMetric;
    readonly automationCoverage: RatioMetric;
    readonly automatedSubsetClassificationAccuracy: RatioMetric;
    readonly reviewRequiredCapture: RatioMetric;
    readonly strictHumanReviewRate: RatioMetric;
    readonly falseAutoCount: number;
    readonly securityReviewRequestedRate: RatioMetric;
    readonly securityHumanReviewRate: RatioMetric;
  };
  readonly probabilities: {
    readonly issueType: ProbabilityDimensionMetrics;
    readonly engineeringArea: ProbabilityDimensionMetrics;
    readonly priority: ProbabilityDimensionMetrics;
    readonly securityProbabilityYes: BinaryProbabilityMetrics;
    readonly humanReviewProbabilityYes: BinaryProbabilityMetrics;
    readonly gateScoreBins: readonly GateScoreBin[];
  };
  readonly latency: {
    readonly kind: 'evaluator-only' | 'live-provider';
    readonly evaluatorProcessingMs: DistributionStats;
    readonly successfulProviderLatencyMs: DistributionStats | null;
    readonly p95Method: 'nearest-rank';
  };
}

export interface EvaluationReport {
  readonly schemaVersion: typeof EVALUATION_SCHEMA_VERSION;
  readonly mode: EvaluationMode;
  readonly provider: 'synthetic-fixture' | 'typesafe-ai-jev';
  readonly datasetVersion: string;
  readonly datasetCount: number;
  readonly executedCount: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly thresholds: {
    readonly auto: number;
    readonly review: number;
  };
  readonly summary: EvaluationSummary;
  readonly cases: readonly EvaluationCaseResult[];
  readonly methodology: {
    readonly annotations: 'human-authored-synthetic';
    readonly fixtureMeasurementsAreProviderPerformance: false;
    readonly oneAnalyzerInvocationPerCase: true;
    readonly providerTransportMayRetry: true;
  };
}

export class EvaluationError extends Error {
  public readonly code:
    | 'invalid_arguments'
    | 'invalid_dataset'
    | 'invalid_fixtures'
    | 'live_confirmation_required'
    | 'missing_api_key'
    | 'unsafe_output_path'
    | 'report_write_failed';

  public constructor(code: EvaluationError['code'], message: string) {
    super(message);
    this.name = 'EvaluationError';
    this.code = code;
  }
}
