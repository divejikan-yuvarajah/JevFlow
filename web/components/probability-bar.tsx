import { formatPercent } from '@/lib/contracts';

interface ProbabilityBarProps {
  readonly label: string;
  readonly value: number;
  readonly tone?: 'violet' | 'cyan' | 'amber' | 'red';
}

export function ProbabilityBar({
  label,
  value,
  tone = 'violet',
}: ProbabilityBarProps) {
  const percent = formatPercent(value);
  return (
    <div className="probability-block">
      <div className="probability-label">
        <span>{label}</span>
        <strong>{percent}</strong>
      </div>
      <div
        className="probability-track"
        role="progressbar"
        aria-label={`${label}: ${percent}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
      >
        <span
          className={`probability-fill fill-${tone}`}
          style={{ width: percent }}
        />
      </div>
    </div>
  );
}
