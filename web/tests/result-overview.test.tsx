import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResultOverview } from '@/components/result-overview';
import { PREVIEW_SCENARIOS } from '@/lib/preview-fixtures';
import { makeLiveView } from './fixtures';

describe('result overview', () => {
  it('labels choice evidence separately and binary values as P(YES)', () => {
    render(<ResultOverview result={makeLiveView()} />);
    expect(screen.getAllByText('Selected option probability')).toHaveLength(3);
    expect(screen.getAllByText('Reported choice confidence')).toHaveLength(3);
    expect(screen.getAllByText('P(YES)')).toHaveLength(2);
    expect(screen.getByText('Security-sensitive P(YES)')).toBeInTheDocument();
    expect(screen.getByText('Needs-human-review P(YES)')).toBeInTheDocument();
  });

  it('renders exactly the projected proposed labels', () => {
    const view = makeLiveView();
    const { container } = render(<ResultOverview result={view} />);
    const chips = [...container.querySelectorAll('.label-chip')].map(
      (chip) => chip.textContent,
    );
    expect(chips).toEqual(view.proposedLabels);
    expect(
      screen.getByText(
        'These labels are not applied to GitHub from this dashboard.',
      ),
    ).toBeInTheDocument();
  });

  it('does not claim model or latency measurements for fixtures', () => {
    const result = PREVIEW_SCENARIOS[0]!.result;
    render(<ResultOverview result={result} />);
    expect(
      screen.getByText('SYNTHETIC PREVIEW — not a Jev result'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Example values · no provider request or measured latency',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Model:/u)).not.toBeInTheDocument();
  });

  it('shows truncation and readable policy reasons without HTML injection', () => {
    const live = makeLiveView();
    const result = {
      ...live,
      policy: {
        ...live.policy,
        mode: 'review-suggested' as const,
        reasonCodes: ['input_truncated_review_suggested'] as const,
      },
      meta: {
        ...live.meta,
        inputTruncated: true,
        truncatedFields: ['body'] as const,
      },
    };
    render(<ResultOverview result={result} />);
    expect(
      screen.getByText('Input was truncated before analysis: body.'),
    ).toBeInTheDocument();
    const banner = screen.getByText('REVIEW SUGGESTED').closest('section');
    expect(banner).not.toBeNull();
    expect(
      within(banner!).getByText(
        'Some issue input was truncated before analysis.',
      ),
    ).toBeInTheDocument();
  });
});
