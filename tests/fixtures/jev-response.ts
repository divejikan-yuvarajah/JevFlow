import type { JevSystemOneResponse } from '../../src/jev/types.js';

export const VALID_JEV_RESPONSE = {
  model: 'jev-test-model',
  answers: {
    issueType: {
      type: 'choice',
      choice: 'bug',
      confidence: 0.81,
      probabilities: {
        bug: 0.62,
        feature: 0.1,
        documentation: 0.1,
        question: 0.08,
        maintenance: 0.1,
      },
    },
    engineeringArea: {
      type: 'choice',
      choice: 'frontend',
      confidence: 0.74,
      probabilities: {
        frontend: 0.55,
        backend: 0.1,
        database: 0.05,
        devops: 0.05,
        ai: 0.05,
        security: 0.1,
        general: 0.1,
      },
    },
    priority: {
      type: 'choice',
      choice: 'medium',
      confidence: 0.68,
      probabilities: {
        critical: 0.05,
        high: 0.2,
        medium: 0.6,
        low: 0.15,
      },
    },
    securitySensitive: { type: 'noul', noul: 0 },
    needsHumanReview: { type: 'noul', noul: 1 },
  },
  usage: { input_tokens: 120, output_tokens: 35 },
} as const satisfies JevSystemOneResponse;
