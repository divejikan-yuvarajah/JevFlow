import type { PublicDecision } from '@/lib/contracts';
import { ProbabilityBar } from './probability-bar';

interface DecisionCardProps {
  readonly eyebrow: string;
  readonly decision: PublicDecision<string>;
  readonly tone?: 'violet' | 'cyan' | 'amber' | 'red';
}

export function DecisionCard({ eyebrow, decision, tone }: DecisionCardProps) {
  return (
    <article className="decision-card">
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
        tone="cyan"
      />
    </article>
  );
}
