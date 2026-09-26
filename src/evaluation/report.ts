import type {
  DistributionStats,
  EvaluationReport,
  RatioMetric,
} from './evaluation.types.js';

function percentage(metric: RatioMetric): string {
  return metric.rate === null ? 'N/A' : `${(metric.rate * 100).toFixed(1)}%`;
}

function ratioText(metric: RatioMetric): string {
  return `${String(metric.numerator)}/${String(metric.denominator)} (${percentage(metric)})`;
}

function numberText(value: number | null, suffix = ''): string {
  return value === null ? 'N/A' : `${value.toFixed(3)}${suffix}`;
}

function statsRow(label: string, stats: DistributionStats): string {
  return `| ${label} | ${String(stats.count)} | ${numberText(stats.average)} | ${numberText(stats.median)} | ${numberText(stats.p95)} |`;
}

function modeHeading(report: EvaluationReport): string {
  return report.mode === 'offline-fixture'
    ? 'OFFLINE SYNTHETIC FIXTURE EVALUATION'
    : 'LIVE Jev EVALUATION';
}

function failureBreakdown(report: EvaluationReport): string {
  const entries = Object.entries(report.summary.accounting.failuresByCode);
  return entries.length === 0
    ? 'none'
    : entries.map(([code, count]) => `${code}: ${String(count)}`).join(', ');
}

export function renderEvaluationJson(report: EvaluationReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderEvaluationMarkdown(report: EvaluationReport): string {
  const { summary } = report;
  const lines = [
    '# JevFlow Evaluation Report',
    '',
    `**Mode: ${modeHeading(report)}**`,
    '',
    `Dataset version: ${report.datasetVersion}`,
    `Dataset cases: ${String(report.datasetCount)}`,
    `Executed cases: ${String(report.executedCount)}`,
    `Started: ${report.startedAt}`,
    `Completed: ${report.completedAt}`,
    `Thresholds: auto ${report.thresholds.auto.toFixed(2)}, review ${report.thresholds.review.toFixed(2)}`,
    '',
    '> The dataset and expected annotations are human-authored synthetic scenarios. Offline fixture results test the harness and policy; they are not measurements of Jev accuracy, latency, cost, or production behavior.',
    '',
    '## Run accounting',
    '',
    `- Succeeded: ${String(summary.accounting.succeeded)}/${String(summary.accounting.total)}`,
    `- Failed: ${String(summary.accounting.failed)}/${String(summary.accounting.total)}`,
    `- Skipped: ${String(summary.accounting.skipped)}/${String(summary.accounting.total)}`,
    `- Completion rate: ${ratioText(summary.accounting.completionRate)}`,
    `- Sanitized failure breakdown: ${failureBreakdown(report)}`,
    '',
    '## Classification',
    '',
    '| Metric | Correct / denominator | Rate |',
    '| --- | ---: | ---: |',
    `| Issue type strict | ${String(summary.classification.issueType.strictAccuracy.numerator)}/${String(summary.classification.issueType.strictAccuracy.denominator)} | ${percentage(summary.classification.issueType.strictAccuracy)} |`,
    `| Engineering area strict | ${String(summary.classification.engineeringArea.strictAccuracy.numerator)}/${String(summary.classification.engineeringArea.strictAccuracy.denominator)} | ${percentage(summary.classification.engineeringArea.strictAccuracy)} |`,
    `| Engineering area acceptable answer | ${String(summary.classification.engineeringArea.acceptableAnswerAccuracy.numerator)}/${String(summary.classification.engineeringArea.acceptableAnswerAccuracy.denominator)} | ${percentage(summary.classification.engineeringArea.acceptableAnswerAccuracy)} |`,
    `| Priority strict | ${String(summary.classification.priority.strictAccuracy.numerator)}/${String(summary.classification.priority.strictAccuracy.denominator)} | ${percentage(summary.classification.priority.strictAccuracy)} |`,
    `| Exact all three | ${String(summary.classification.exactAllThreeAccuracy.numerator)}/${String(summary.classification.exactAllThreeAccuracy.denominator)} | ${percentage(summary.classification.exactAllThreeAccuracy)} |`,
    '',
    '## Policy outcomes',
    '',
    `- Auto: ${String(summary.automation.autoCount)}/${String(summary.accounting.succeeded)}`,
    `- Review suggested: ${String(summary.automation.reviewSuggestedCount)}/${String(summary.accounting.succeeded)}`,
    `- Human review: ${String(summary.automation.humanReviewCount)}/${String(summary.accounting.succeeded)}`,
    `- Automation coverage: ${ratioText(summary.automation.automationCoverage)}`,
    `- Automated subset exact classification: ${ratioText(summary.automation.automatedSubsetClassificationAccuracy)}`,
    `- Annotated review-required capture (review-suggested or human-review): ${ratioText(summary.automation.reviewRequiredCapture)}`,
    `- Annotated review-required routed strictly to human-review: ${ratioText(summary.automation.strictHumanReviewRate)}`,
    `- False-auto count: ${String(summary.automation.falseAutoCount)}`,
    `- Annotated security cohort with security review requested: ${ratioText(summary.automation.securityReviewRequestedRate)}`,
    `- Annotated security cohort routed to human-review: ${ratioText(summary.automation.securityHumanReviewRate)}`,
    '',
    'These review and security cohorts use subjective human annotations. `security-review` requests investigation and does not confirm a vulnerability.',
    '',
    '## Choice probability and reported confidence',
    '',
    '| Measure | Count | Average | Median | P95 |',
    '| --- | ---: | ---: | ---: | ---: |',
    statsRow(
      'Issue type selected probability',
      summary.probabilities.issueType.selectedProbability,
    ),
    statsRow(
      'Issue type reported confidence',
      summary.probabilities.issueType.reportedConfidence,
    ),
    statsRow(
      'Engineering area selected probability',
      summary.probabilities.engineeringArea.selectedProbability,
    ),
    statsRow(
      'Engineering area reported confidence',
      summary.probabilities.engineeringArea.reportedConfidence,
    ),
    statsRow(
      'Priority selected probability',
      summary.probabilities.priority.selectedProbability,
    ),
    statsRow(
      'Priority reported confidence',
      summary.probabilities.priority.reportedConfidence,
    ),
    statsRow(
      'Security P(YES)',
      summary.probabilities.securityProbabilityYes.all,
    ),
    statsRow(
      'Needs-human-review P(YES)',
      summary.probabilities.humanReviewProbabilityYes.all,
    ),
    '',
    'Selected-option probability and provider-reported confidence are separate choice measures. Binary P(YES) is neither choice confidence nor proof of a security issue.',
    '',
    '## Exploratory gate-score bins',
    '',
    '| Gate interval | Cases | Exact all three | Observed rate |',
    '| --- | ---: | ---: | ---: |',
    ...summary.probabilities.gateScoreBins.map(
      (bin) =>
        `| ${bin.label} | ${String(bin.count)} | ${String(bin.exactAllThreeCorrect)} | ${bin.observedExactAccuracy === null ? 'N/A' : `${(bin.observedExactAccuracy * 100).toFixed(1)}%`} |`,
    ),
    '',
    'These small bins are descriptive and are not a provider calibration claim.',
    '',
    '## Latency',
    '',
  ];

  if (report.mode === 'offline-fixture') {
    lines.push(
      `Evaluator processing duration: average ${numberText(summary.latency.evaluatorProcessingMs.average, ' ms')}, median ${numberText(summary.latency.evaluatorProcessingMs.median, ' ms')}, p95 ${numberText(summary.latency.evaluatorProcessingMs.p95, ' ms')}.`,
      '',
      'Jev provider latency: N/A. Synthetic fixture metadata is excluded from provider latency.',
    );
  } else {
    const provider = summary.latency.successfulProviderLatencyMs;
    lines.push(
      provider === null
        ? 'Jev provider latency: N/A.'
        : `Successful Jev provider latency: average ${numberText(provider.average, ' ms')}, median ${numberText(provider.median, ' ms')}, p95 ${numberText(provider.p95, ' ms')} using nearest-rank p95.`,
      '',
      'Each case invokes the analyzer once at application level; SDK transport retries may cause more than one physical HTTP attempt.',
    );
  }

  lines.push(
    '',
    '## Limitations',
    '',
    '- Thirty synthetic cases are too small to establish production accuracy or calibration.',
    '- Expected categories and review flags reflect a documented annotation rubric and can remain subjective.',
    '- Proposed labels are policy output; this evaluation does not mutate or verify GitHub issue labels.',
    '- Provider behavior may vary across live runs and model versions.',
    '',
  );
  return lines.join('\n');
}
