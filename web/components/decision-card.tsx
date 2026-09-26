import type { PublicDecision } from '@/lib/contracts';
import { ProbabilityBar } from './probability-bar';

interface DecisionCardProps {
  readonly eyebrow: string;
  readonly decision: PublicDecision<string>;
  readonly tone?: 'primary' | 'information' | 'warning' | 'critical';
}

export function DecisionCard({
  eyebrow,
  decision,
  tone = 'primary',
}: DecisionCardProps) {
  return (
    <article className={`decision-card tone-${tone}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h3>{decision.value}</h3>
      <ProbabilityBar
        label="Selected option probability"
        value={decision.selectedProbability}
        tone={tone}
      />
      <ProbabilityBar
        label="Reported choice confidence"
        value={decision.reportedConfidence}
        tone="information"
      />
    </article>
  );
}
