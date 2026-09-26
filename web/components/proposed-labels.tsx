import type { ProposedLabel } from '../../dist/github/labels.js';

interface ProposedLabelsProps {
  readonly labels: readonly ProposedLabel[];
}

export function ProposedLabels({ labels }: ProposedLabelsProps) {
  return (
    <section className="labels-section" aria-labelledby="labels-heading">
      <div>
        <p className="eyebrow">GitHub labels</p>
        <h3 id="labels-heading">Proposed locally</h3>
      </div>
      <p className="section-note">
        These labels are not applied to GitHub from this dashboard.
      </p>
      <div className="label-list">
        {labels.map((label) => (
          <span className="label-chip" key={label}>
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
