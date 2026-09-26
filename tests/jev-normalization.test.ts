import { describe, expect, it } from 'vitest';

import { normalizeJevResult } from '../src/triage/normalizeResult.js';
import { TriageError } from '../src/triage/triage.types.js';
import { VALID_JEV_RESPONSE } from './fixtures/jev-response.js';

const METADATA = {
  latencyMs: 12.5,
  inputTruncated: true,
  truncatedFields: ['body'],
} as const;

describe('normalizeJevResult', () => {
  it('normalizes the official SDK response shape without conflating metrics', () => {
    const result = normalizeJevResult(VALID_JEV_RESPONSE, METADATA);

    expect(result.issueType).toEqual({
      value: 'bug',
      selectedProbability: 0.62,
      confidence: 0.81,
      probabilities: VALID_JEV_RESPONSE.answers.issueType.probabilities,
    });
    expect(result.issueType.selectedProbability).not.toBe(
      result.issueType.confidence,
    );
    expect(result.securitySensitive).toEqual({ probabilityYes: 0 });
    expect(result.needsHumanReview).toEqual({ probabilityYes: 1 });
    expect(result.meta).toEqual({
      model: 'jev-test-model',
      latencyMs: 12.5,
      inputTruncated: true,
      truncatedFields: ['body'],
      usage: { inputTokens: 120, outputTokens: 35 },
    });
  });

  it('accepts fractional NOUL P(YES) values', () => {
    const response = {
      ...VALID_JEV_RESPONSE,
      answers: {
        ...VALID_JEV_RESPONSE.answers,
        securitySensitive: { type: 'noul', noul: 0.42 },
      },
    };
    expect(
      normalizeJevResult(response, METADATA).securitySensitive.probabilityYes,
    ).toBe(0.42);
  });

  it.each([
    ['unknown selected choice', { choice: 'incident' }],
    ['missing selected probability', { probabilities: { bug: undefined } }],
    ['wrong answer type', { type: 'noul' }],
    ['NaN probability', { probabilities: { bug: Number.NaN } }],
    [
      'infinite probability',
      { probabilities: { bug: Number.POSITIVE_INFINITY } },
    ],
    ['negative probability', { probabilities: { bug: -0.1 } }],
    ['probability above one', { probabilities: { bug: 1.1 } }],
    ['invalid confidence', { confidence: Number.NaN }],
  ])('rejects %s', (_name, change) => {
    const original = VALID_JEV_RESPONSE.answers.issueType;
    const response = {
      ...VALID_JEV_RESPONSE,
      answers: {
        ...VALID_JEV_RESPONSE.answers,
        issueType: {
          ...original,
          ...change,
          probabilities:
            'probabilities' in change
              ? { ...original.probabilities, ...change.probabilities }
              : original.probabilities,
        },
      },
    };
    expect(() => normalizeJevResult(response, METADATA)).toThrow(TriageError);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1])(
    'rejects invalid NOUL value %s',
    (noul) => {
      const response = {
        ...VALID_JEV_RESPONSE,
        answers: {
          ...VALID_JEV_RESPONSE.answers,
          securitySensitive: { type: 'noul', noul },
        },
      };
      expect(() => normalizeJevResult(response, METADATA)).toThrow(TriageError);
    },
  );

  it('rejects a missing required question', () => {
    const response = {
      ...VALID_JEV_RESPONSE,
      answers: { ...VALID_JEV_RESPONSE.answers, priority: undefined },
    };
    expect(() => normalizeJevResult(response, METADATA)).toThrow(TriageError);
  });

  it.each([
    { ...VALID_JEV_RESPONSE, model: '' },
    { ...VALID_JEV_RESPONSE, usage: undefined },
    {
      ...VALID_JEV_RESPONSE,
      usage: { input_tokens: -1, output_tokens: 2 },
    },
    {
      ...VALID_JEV_RESPONSE,
      usage: { input_tokens: 1, output_tokens: 1.5 },
    },
  ])('rejects missing or invalid model and usage metadata', (response) => {
    expect(() => normalizeJevResult(response, METADATA)).toThrow(TriageError);
  });
});
