import { describe, expect, it } from 'vitest';
import {
  formatPercent,
  isPublicTriageView,
  parsePublicApiResponse,
  PublicContractError,
} from '@/lib/contracts';
import { PREVIEW_SCENARIOS } from '@/lib/preview-fixtures';
import { makeLiveView } from './fixtures';

describe('public response contract', () => {
  it('formats zero, one, and intermediate probabilities correctly', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(1)).toBe('100%');
    expect(formatPercent(0.456)).toBe('45.6%');
  });

  it('accepts valid live and synthetic views', () => {
    expect(isPublicTriageView(makeLiveView())).toBe(true);
    expect(isPublicTriageView(PREVIEW_SCENARIOS[0]?.result)).toBe(true);
  });

  it('keeps measured metadata out of fixture previews', () => {
    const fixture = PREVIEW_SCENARIOS[0]?.result;
    expect(fixture?.meta.model).toBeUndefined();
    expect(fixture?.meta.latencyMs).toBeUndefined();
    expect(fixture?.meta.usage).toBeUndefined();
    expect(
      isPublicTriageView({
        ...fixture,
        meta: { ...fixture?.meta, latencyMs: 0 },
      }),
    ).toBe(false);
  });

  it('rejects invalid probabilities and additional response fields', () => {
    const view = makeLiveView();
    expect(
      isPublicTriageView({
        ...view,
        issueType: { ...view.issueType, selectedProbability: 1.1 },
      }),
    ).toBe(false);
    expect(() =>
      parsePublicApiResponse({
        ok: true,
        result: view,
        leaked: 'secret',
      }),
    ).toThrow(PublicContractError);
  });
});
