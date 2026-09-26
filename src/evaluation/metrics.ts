import type {
  DistributionStats,
  EvaluationCaseResult,
  EvaluationMode,
  ProbabilityDimensionMetrics,
  EvaluationSuccess,
  EvaluationSummary,
  GateScoreBin,
  RatioMetric,
} from './evaluation.types.js';

export function ratio(numerator: number, denominator: number): RatioMetric {
  return {
    numerator,
    denominator,
    rate: denominator === 0 ? null : numerator / denominator,
  };
}

export function distributionStats(input: readonly number[]): DistributionStats {
  const values = input
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (values.length === 0) {
    return { count: 0, average: null, median: null, p95: null };
  }
  const sum = values.reduce((total, value) => total + value, 0);
  const middle = Math.floor(values.length / 2);
  const median =
    values.length % 2 === 1
      ? (values[middle] ?? 0)
      : ((values[middle - 1] ?? 0) + (values[middle] ?? 0)) / 2;
  const p95Index = Math.max(0, Math.ceil(0.95 * values.length) - 1);
  return {
    count: values.length,
    average: sum / values.length,
    median,
    p95: values[p95Index] ?? null,
  };
}

function exactAllThree(result: EvaluationSuccess): boolean {
  return (
    result.predicted.issueType === result.expected.issueType &&
    result.predicted.engineeringArea === result.expected.engineeringArea &&
    result.predicted.priority === result.expected.priority
  );
}

function confusionMatrix(
  successes: readonly EvaluationSuccess[],
  expected: (result: EvaluationSuccess) => string,
  predicted: (result: EvaluationSuccess) => string,
): Readonly<Record<string, Readonly<Record<string, number>>>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const result of successes) {
    const expectedValue = expected(result);
    const predictedValue = predicted(result);
    const row = matrix[expectedValue] ?? {};
    row[predictedValue] = (row[predictedValue] ?? 0) + 1;
    matrix[expectedValue] = row;
  }
  return matrix;
}

function strictAccuracy(
  successes: readonly EvaluationSuccess[],
  expected: (result: EvaluationSuccess) => string,
  predicted: (result: EvaluationSuccess) => string,
): RatioMetric {
  return ratio(
    successes.filter((result) => expected(result) === predicted(result)).length,
    successes.length,
  );
}

function binaryCohortStats(
  successes: readonly EvaluationSuccess[],
  value: (result: EvaluationSuccess) => number,
  annotation: (result: EvaluationSuccess) => boolean,
): {
  readonly all: DistributionStats;
  readonly annotatedYes: DistributionStats;
  readonly annotatedNo: DistributionStats;
} {
  return {
    all: distributionStats(successes.map(value)),
    annotatedYes: distributionStats(successes.filter(annotation).map(value)),
    annotatedNo: distributionStats(
      successes.filter((result) => !annotation(result)).map(value),
    ),
  };
}

function gateScoreBins(
  successes: readonly EvaluationSuccess[],
): readonly GateScoreBin[] {
  const definitions = [
    { label: '[0.00, 0.75)', lowerInclusive: 0, upperExclusive: 0.75 },
    { label: '[0.75, 0.90)', lowerInclusive: 0.75, upperExclusive: 0.9 },
    { label: '[0.90, 1.00]', lowerInclusive: 0.9, upperExclusive: null },
  ] as const;
  return definitions.map((definition) => {
    const members = successes.filter(
      (result) =>
        result.overallChoiceGateScore >= definition.lowerInclusive &&
        (definition.upperExclusive === null ||
          result.overallChoiceGateScore < definition.upperExclusive),
    );
    const correct = members.filter(exactAllThree).length;
    return {
      ...definition,
      count: members.length,
      exactAllThreeCorrect: correct,
      observedExactAccuracy:
        members.length === 0 ? null : correct / members.length,
    };
  });
}

export function calculateEvaluationSummary(
  cases: readonly EvaluationCaseResult[],
  mode: EvaluationMode,
): EvaluationSummary {
  const successes = cases.filter(
    (result): result is EvaluationSuccess => result.status === 'succeeded',
  );
  const failures = cases.filter((result) => result.status === 'failed');
  const failuresByCode: Record<string, number> = {};
  for (const failure of failures) {
    failuresByCode[failure.errorCode] =
      (failuresByCode[failure.errorCode] ?? 0) + 1;
  }

  const auto = successes.filter((result) => result.policyMode === 'auto');
  const reviewSuggested = successes.filter(
    (result) => result.policyMode === 'review-suggested',
  );
  const humanReview = successes.filter(
    (result) => result.policyMode === 'human-review',
  );
  const annotatedReview = successes.filter(
    (result) => result.expected.needsHumanReview,
  );
  const annotatedSecurity = successes.filter(
    (result) => result.expected.securitySensitive,
  );

  const areaStrict = strictAccuracy(
    successes,
    (result) => result.expected.engineeringArea,
    (result) => result.predicted.engineeringArea,
  );
  const acceptableAreaCorrect = successes.filter(
    (result) =>
      result.predicted.engineeringArea === result.expected.engineeringArea ||
      (result.expected.acceptableAlternativeAreas?.includes(
        result.predicted.engineeringArea,
      ) ??
        false),
  ).length;

  const probabilityDimension = (
    dimension: 'issueType' | 'engineeringArea' | 'priority',
  ): ProbabilityDimensionMetrics => ({
    selectedProbability: distributionStats(
      successes.map(
        (result) => result.choiceEvidence[dimension].selectedProbability,
      ),
    ),
    reportedConfidence: distributionStats(
      successes.map(
        (result) => result.choiceEvidence[dimension].reportedConfidence,
      ),
    ),
  });

  return {
    accounting: {
      total: cases.length,
      succeeded: successes.length,
      failed: failures.length,
      skipped: 0,
      completionRate: ratio(successes.length, cases.length),
      failuresByCode,
    },
    classification: {
      issueType: {
        strictAccuracy: strictAccuracy(
          successes,
          (result) => result.expected.issueType,
          (result) => result.predicted.issueType,
        ),
        confusionMatrix: confusionMatrix(
          successes,
          (result) => result.expected.issueType,
          (result) => result.predicted.issueType,
        ),
      },
      engineeringArea: {
        strictAccuracy: areaStrict,
        acceptableAnswerAccuracy: ratio(
          acceptableAreaCorrect,
          successes.length,
        ),
        confusionMatrix: confusionMatrix(
          successes,
          (result) => result.expected.engineeringArea,
          (result) => result.predicted.engineeringArea,
        ),
      },
      priority: {
        strictAccuracy: strictAccuracy(
          successes,
          (result) => result.expected.priority,
          (result) => result.predicted.priority,
        ),
        confusionMatrix: confusionMatrix(
          successes,
          (result) => result.expected.priority,
          (result) => result.predicted.priority,
        ),
      },
      exactAllThreeAccuracy: ratio(
        successes.filter(exactAllThree).length,
        successes.length,
      ),
    },
    automation: {
      autoCount: auto.length,
      reviewSuggestedCount: reviewSuggested.length,
      humanReviewCount: humanReview.length,
      autoProportion: ratio(auto.length, successes.length),
      reviewSuggestedProportion: ratio(
        reviewSuggested.length,
        successes.length,
      ),
      humanReviewProportion: ratio(humanReview.length, successes.length),
      automationCoverage: ratio(auto.length, successes.length),
      automatedSubsetClassificationAccuracy: ratio(
        auto.filter(exactAllThree).length,
        auto.length,
      ),
      reviewRequiredCapture: ratio(
        annotatedReview.filter((result) => result.policyMode !== 'auto').length,
        annotatedReview.length,
      ),
      strictHumanReviewRate: ratio(
        annotatedReview.filter((result) => result.policyMode === 'human-review')
          .length,
        annotatedReview.length,
      ),
      falseAutoCount: annotatedReview.filter(
        (result) => result.policyMode === 'auto',
      ).length,
      securityReviewRequestedRate: ratio(
        annotatedSecurity.filter((result) => result.securityReviewRequested)
          .length,
        annotatedSecurity.length,
      ),
      securityHumanReviewRate: ratio(
        annotatedSecurity.filter(
          (result) => result.policyMode === 'human-review',
        ).length,
        annotatedSecurity.length,
      ),
    },
    probabilities: {
      issueType: probabilityDimension('issueType'),
      engineeringArea: probabilityDimension('engineeringArea'),
      priority: probabilityDimension('priority'),
      securityProbabilityYes: binaryCohortStats(
        successes,
        (result) => result.securityProbabilityYes,
        (result) => result.expected.securitySensitive,
      ),
      humanReviewProbabilityYes: binaryCohortStats(
        successes,
        (result) => result.humanReviewProbabilityYes,
        (result) => result.expected.needsHumanReview,
      ),
      gateScoreBins: gateScoreBins(successes),
    },
    latency: {
      kind: mode === 'live-jev' ? 'live-provider' : 'evaluator-only',
      evaluatorProcessingMs: distributionStats(
        cases.map((result) => result.evaluatorDurationMs),
      ),
      successfulProviderLatencyMs:
        mode === 'live-jev'
          ? distributionStats(
              successes.flatMap((result) =>
                result.providerLatencyMs === null
                  ? []
                  : [result.providerLatencyMs],
              ),
            )
          : null,
      p95Method: 'nearest-rank',
    },
  };
}
