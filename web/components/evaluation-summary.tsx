import { formatPercent } from '@/lib/contracts';
import type {
  DisplayRatio,
  EvaluationDisplayReport,
} from '@/lib/evaluation-report';

interface EvaluationSummaryProps {
  readonly report: EvaluationDisplayReport | null;
}

function ratioText(metric: DisplayRatio): string {
  const rate = metric.rate === null ? 'N/A' : formatPercent(metric.rate);
  return `${String(metric.numerator)}/${String(metric.denominator)} · ${rate}`;
}

export function EvaluationSummary({ report }: EvaluationSummaryProps) {
  if (report === null) {
    return (
      <section className="evaluation-empty">
        <p className="eyebrow">No safe artifact found</p>
        <h2>Evaluation report not generated yet</h2>
        <p>
          Generate a local synthetic fixture report from the repository root. It
          measures the harness, not Jev performance.
        </p>
        <code>
          npm run eval -- --mode fixture --format json --output
          evals/results/dashboard-evaluation.json
        </code>
      </section>
    );
  }

  const fixture = report.mode === 'offline-fixture';
  const metrics = [
    ['Issue type accuracy', report.issueTypeAccuracy],
    ['Engineering area accuracy', report.areaAccuracy],
    ['Priority accuracy', report.priorityAccuracy],
    ['Exact all three', report.exactAllThreeAccuracy],
  ] as const;
  return (
    <section className="evaluation-report">
      <div className="evaluation-provenance">
        <span className={`provenance-badge ${fixture ? 'synthetic' : 'live'}`}>
          {fixture ? 'OFFLINE SYNTHETIC FIXTURE' : 'LIVE JEV EVALUATION'}
        </span>
        <p>
          Human-authored synthetic dataset · version {report.datasetVersion} ·{' '}
          completed {new Date(report.completedAt).toLocaleDateString('en-US')}
        </p>
      </div>

      <div className="evaluation-hero-grid">
        <article>
          <span>Dataset</span>
          <strong>{report.datasetCount}</strong>
          <small>{report.executedCount} executed</small>
        </article>
        <article>
          <span>Automation coverage</span>
          <strong>
            {report.automationCoverage.rate === null
              ? 'N/A'
              : formatPercent(report.automationCoverage.rate)}
          </strong>
          <small>{ratioText(report.automationCoverage)}</small>
        </article>
        <article>
          <span>Exact classification</span>
          <strong>
            {report.exactAllThreeAccuracy.rate === null
              ? 'N/A'
              : formatPercent(report.exactAllThreeAccuracy.rate)}
          </strong>
          <small>{ratioText(report.exactAllThreeAccuracy)}</small>
        </article>
      </div>

      <div
        className="metric-table"
        role="table"
        aria-label="Classification metrics"
      >
        <div className="metric-row metric-header" role="row">
          <span role="columnheader">Classification measure</span>
          <span role="columnheader">Correct / denominator</span>
        </div>
        {metrics.map(([label, metric]) => (
          <div className="metric-row" role="row" key={label}>
            <span role="cell">{label}</span>
            <strong role="cell">{ratioText(metric)}</strong>
          </div>
        ))}
      </div>

      <div className="evidence-grid">
        <article>
          <p className="eyebrow">Issue type evidence</p>
          <h3>
            Selected probability:{' '}
            {report.averageSelectedProbability === null
              ? 'N/A'
              : formatPercent(report.averageSelectedProbability)}
          </h3>
          <p>
            Reported confidence:{' '}
            {report.averageReportedConfidence === null
              ? 'N/A'
              : formatPercent(report.averageReportedConfidence)}{' '}
            · n=
            {report.probabilitySampleCount}
          </p>
        </article>
        <article>
          <p className="eyebrow">Provider latency</p>
          {report.providerLatencyMs === null ? (
            <>
              <h3>Not measured</h3>
              <p>Synthetic fixture timing is not presented as Jev latency.</p>
            </>
          ) : (
            <>
              <h3>{report.providerLatencyMs.average.toFixed(1)} ms average</h3>
              <p>
                Median {report.providerLatencyMs.median.toFixed(1)} ms · P95{' '}
                {report.providerLatencyMs.p95.toFixed(1)} ms
              </p>
            </>
          )}
        </article>
      </div>

      {fixture ? (
        <div className="evaluation-caveat">
          These deterministic fixture results validate the evaluation harness
          and policy behavior. They are not measurements of Jev accuracy,
          calibration, latency, or production performance.
        </div>
      ) : null}
    </section>
  );
}
