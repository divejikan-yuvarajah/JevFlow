import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from '../src/config/env.js';

describe('loadConfig', () => {
  it.each([
    [{}, 0.9, 0.75],
    [{ AUTO_THRESHOLD: '', REVIEW_THRESHOLD: '   ' }, 0.9, 0.75],
  ])('uses defaults for missing or empty values', (env, auto, review) => {
    const config = loadConfig(env);
    expect(config.autoThreshold).toBe(auto);
    expect(config.reviewThreshold).toBe(review);
  });

  it.each([
    ['0', '0', 0, 0],
    ['1', '1', 1, 1],
    [' 0.95 ', ' 0.8 ', 0.95, 0.8],
  ])(
    'parses valid custom thresholds',
    (autoValue, reviewValue, expectedAuto, expectedReview) => {
      const config = loadConfig({
        AUTO_THRESHOLD: autoValue,
        REVIEW_THRESHOLD: reviewValue,
      });
      expect(config.autoThreshold).toBe(expectedAuto);
      expect(config.reviewThreshold).toBe(expectedReview);
    },
  );

  it.each(['letters', 'NaN', 'Infinity', '-0.01', '1.01'])(
    'rejects invalid AUTO_THRESHOLD value %s',
    (value) => {
      expect(() => loadConfig({ AUTO_THRESHOLD: value })).toThrow(ConfigError);
    },
  );

  it.each(['letters', 'NaN', '-Infinity', '-1', '2'])(
    'rejects invalid REVIEW_THRESHOLD value %s',
    (value) => {
      expect(() => loadConfig({ REVIEW_THRESHOLD: value })).toThrow(
        ConfigError,
      );
    },
  );

  it('rejects review threshold above automatic threshold', () => {
    expect(() =>
      loadConfig({ AUTO_THRESHOLD: '0.7', REVIEW_THRESHOLD: '0.8' }),
    ).toThrow('REVIEW_THRESHOLD must be less than or equal to AUTO_THRESHOLD.');
  });

  it('does not expose secret material in config errors', () => {
    const secret = 'private-test-secret';
    expect.assertions(2);
    try {
      loadConfig({
        AUTO_THRESHOLD: 'invalid',
        TYPESAFE_API_KEY: secret,
        GITHUB_TOKEN: secret,
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ConfigError);
      expect(String(error)).not.toContain(secret);
    }
  });
});
