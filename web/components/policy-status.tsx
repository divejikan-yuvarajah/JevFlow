import type { PublicTriageView } from '@/lib/contracts';
import { formatPercent } from '@/lib/contracts';
import { POLICY_REASON_COPY } from '@/lib/reason-copy';

interface PolicyStatusProps {
  readonly policy: PublicTriageView['policy'];
}

const MODE_COPY = {
  auto: {
    title: 'AUTO',
    description: 'The policy permits automatic local label proposals.',
  },
  'review-suggested': {
    title: 'REVIEW SUGGESTED',
    description: 'A maintainer review is recommended before acting.',
  },
  'human-review': {
    title: 'HUMAN REVIEW',
    description: 'The policy requires a person to make the final decision.',
  },
} as const;

export function PolicyStatus({ policy }: PolicyStatusProps) {
  const copy = MODE_COPY[policy.mode];
  return (
    <section className={`policy-banner policy-${policy.mode}`}>
      <div className="policy-heading">
        <div>
          <p className="eyebrow">Deterministic policy</p>
          <h3>{copy.title}</h3>
        </div>
        <span className="gate-score">
          Gate score {formatPercent(policy.overallChoiceGateScore)}
        </span>
      </div>
      <p>{copy.description}</p>
      {policy.classificationLabelsWithheld ? (
        <p className="withheld-note">
          Classification labels are intentionally withheld in human-review mode.
        </p>
      ) : null}
      <ul>
        {policy.reasonCodes.map((reason) => (
          <li key={reason}>{POLICY_REASON_COPY[reason]}</li>
        ))}
      </ul>
      <p className="threshold-copy">
        Policy thresholds: auto {formatPercent(policy.thresholdsUsed.auto)} ·
        review {formatPercent(policy.thresholdsUsed.review)}
      </p>
    </section>
  );
}
