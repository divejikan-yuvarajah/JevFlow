import type { PublicTriageView } from '@/lib/contracts';
import { DecisionCard } from './decision-card';
import { PolicyStatus } from './policy-status';
import { ProbabilityBar } from './probability-bar';
import { ProposedLabels } from './proposed-labels';

interface ResultOverviewProps {
  readonly result: PublicTriageView | null;
}

export function ResultOverview({ result }: ResultOverviewProps) {
  if (result === null) {
    return (
      <section
        className="result-shell empty-result"
        aria-label="Analysis result"
      >
        <div className="empty-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="eyebrow">Decision workspace</p>
        <h2>Your typed triage result appears here</h2>
        <p>
          Choose a synthetic scenario for an offline preview, or enable a
          deliberate local Jev request on the server.
        </p>
        <div className="architecture-flow" aria-label="Analysis architecture">
          <span>Issue</span>
          <b>→</b>
          <span>Jev</span>
          <b>→</b>
          <span>Typed decisions</span>
          <b>→</b>
          <span>Policy</span>
          <b>→</b>
          <span>Proposed labels</span>
        </div>
      </section>
    );
  }

  const synthetic = result.source === 'synthetic_fixture';
  return (
    <section className="result-shell" aria-label="Analysis result">
      <div className="result-topline">
        <span
          className={`provenance-badge ${synthetic ? 'synthetic' : 'live'}`}
        >
          {synthetic
            ? 'SYNTHETIC PREVIEW — not a Jev result'
            : 'LIVE JEV RESULT'}
        </span>
        <span className="result-ready">Decision ready</span>
      </div>

      <div className="decision-grid">
        <DecisionCard eyebrow="Issue type" decision={result.issueType} />
        <DecisionCard
          eyebrow="Engineering area"
          decision={result.engineeringArea}
          tone="information"
        />
        <DecisionCard
          eyebrow="Priority"
          decision={result.priority}
          tone={result.priority.value === 'critical' ? 'critical' : 'warning'}
        />
      </div>

      <div className="binary-grid">
        <article className="binary-card security-indicator">
          <div>
            <p className="eyebrow">Security sensitive</p>
            <h3>P(YES)</h3>
          </div>
          <ProbabilityBar
            label="Security-sensitive P(YES)"
            value={result.securitySensitiveProbabilityYes}
            tone="critical"
          />
          <p>Requests investigation; it does not confirm a vulnerability.</p>
        </article>
        <article className="binary-card review-indicator">
          <div>
            <p className="eyebrow">Needs human review</p>
            <h3>P(YES)</h3>
          </div>
          <ProbabilityBar
            label="Needs-human-review P(YES)"
            value={result.needsHumanReviewProbabilityYes}
            tone="warning"
          />
          <p>This probability is separate from choice confidence.</p>
        </article>
      </div>

      <PolicyStatus policy={result.policy} />
      <ProposedLabels labels={result.proposedLabels} />

      {result.meta.inputTruncated ? (
        <div className="truncation-warning" role="status">
          Input was truncated before analysis:{' '}
          {result.meta.truncatedFields.join(', ')}.
        </div>
      ) : null}

      <div className="metadata-row">
        {synthetic ? (
          <span>Example values · no provider request or measured latency</span>
        ) : (
          <>
            <span>Model: {result.meta.model}</span>
            <span>Latency: {result.meta.latencyMs?.toFixed(0)} ms</span>
            <span>
              Usage: {result.meta.usage?.inputTokens} in /{' '}
              {result.meta.usage?.outputTokens} out
            </span>
          </>
        )}
      </div>

      <div
        className="architecture-flow compact"
        aria-label="Analysis architecture"
      >
        <span>Issue</span>
        <b>→</b>
        <span>Jev</span>
        <b>→</b>
        <span>Typed decisions</span>
        <b>→</b>
        <span>Policy</span>
        <b>→</b>
        <span>Proposed labels</span>
      </div>
    </section>
  );
}
