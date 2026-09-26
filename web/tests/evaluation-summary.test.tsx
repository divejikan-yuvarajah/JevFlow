import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EvaluationSummary } from '@/components/evaluation-summary';

describe('evaluation summary', () => {
  it('shows an honest command when no measured report is available', () => {
    render(<EvaluationSummary report={null} />);
    expect(
      screen.getByText('Evaluation report not generated yet'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/npm run eval -- --mode fixture/u),
    ).toBeInTheDocument();
    expect(screen.queryByText(/%/u)).not.toBeInTheDocument();
  });

  it('renders denominators and does not present fixture timing as Jev latency', () => {
    render(
      <EvaluationSummary
        report={{
          mode: 'offline-fixture',
          provider: 'synthetic-fixture',
          datasetVersion: '2026.09.1',
          datasetCount: 30,
          executedCount: 30,
          completedAt: '2026-09-26T17:57:39.208Z',
          issueTypeAccuracy: { numerator: 29, denominator: 30, rate: 29 / 30 },
          areaAccuracy: { numerator: 26, denominator: 30, rate: 26 / 30 },
          priorityAccuracy: { numerator: 27, denominator: 30, rate: 0.9 },
          exactAllThreeAccuracy: {
            numerator: 23,
            denominator: 30,
            rate: 23 / 30,
          },
          automationCoverage: { numerator: 12, denominator: 30, rate: 0.4 },
          averageSelectedProbability: 0.91,
          averageReportedConfidence: 0.88,
          probabilitySampleCount: 30,
          providerLatencyMs: null,
        }}
      />,
    );
    expect(screen.getAllByText(/29\/30/u).length).toBeGreaterThan(0);
    expect(screen.getByText('Not measured')).toBeInTheDocument();
    expect(
      screen.getByText(/not measurements of Jev accuracy/u),
    ).toBeInTheDocument();
  });
});
