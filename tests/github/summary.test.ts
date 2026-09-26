import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { evaluateTriagePolicy } from '../../src/policy/confidenceGate.js';
import {
  appendGitHubSummary,
  renderGitHubSummary,
} from '../../src/github/summary.js';
import { createTriageResult } from '../fixtures/triage-result.js';
import { TARGET } from './helpers.js';

describe('renderGitHubSummary', () => {
  it('renders distinct probabilities, confidence, policy, and real changes', () => {
    const result = createTriageResult({
      issueTypeProbability: 0.96,
      issueTypeConfidence: 0.94,
      engineeringAreaProbability: 0.93,
      engineeringAreaConfidence: 0.91,
      priorityProbability: 0.87,
      priorityConfidence: 0.84,
      securityProbabilityYes: 0.41,
      humanReviewProbabilityYes: 0.82,
    });
    const plan = evaluateTriagePolicy(result, {
      autoThreshold: 0.9,
      reviewThreshold: 0.75,
    });

    const markdown = renderGitHubSummary({
      status: 'completed',
      target: TARGET,
      result,
      plan,
      operations: {
        status: 'completed',
        created: ['jev:human-review'],
        added: ['jev:human-review'],
        removed: ['jev:auto-triaged'],
        unchanged: ['human_[label](javascript:alert(1))\n# injected'],
        failures: [],
      },
    });

    expect(markdown).toContain('P(selected)');
    expect(markdown).toContain('Reported confidence');
    expect(markdown).toContain('| Issue type | bug | 0.960 | 0.940 |');
    expect(markdown).toContain('Security sensitive P(YES): 0.410');
    expect(markdown).toContain('Needs human review P(YES): 0.820');
    expect(markdown).toContain('Provider latency: 12.5 ms');
    expect(markdown).toContain('Created catalog labels: jev:human-review');
    expect(markdown).toContain(
      'human\\_\\[label\\]\\(javascript:alert\\(1\\)\\) \\# injected',
    );
    expect(markdown).not.toContain('\n# injected');
    expect(markdown).toContain('does not confirm a vulnerability');
  });

  it('renders fallback without choices, probabilities, latency, or raw errors', () => {
    const markdown = renderGitHubSummary({
      status: 'human-review-fallback',
      target: TARGET,
      failureCode: 'provider_unavailable',
      operations: {
        status: 'completed',
        created: [],
        added: ['jev:human-review'],
        removed: ['jev:auto-triaged'],
        unchanged: [],
        failures: [],
      },
    });

    expect(markdown).toContain('Run status: Human review fallback');
    expect(markdown).toContain(
      'No classifications or probabilities were fabricated.',
    );
    expect(markdown).not.toContain('P(selected)');
    expect(markdown).not.toContain('Provider latency');
    expect(markdown).not.toContain('secret provider response');
  });
});

describe('appendGitHubSummary', () => {
  it('appends to an absolute runner-provided path', async () => {
    const path = join(tmpdir(), `jevflow-summary-${randomUUID()}.md`);

    await appendGitHubSummary(path, '# First\n');
    await appendGitHubSummary(path, '# Second\n');

    await expect(readFile(path, 'utf8')).resolves.toBe('# First\n# Second\n');
  });

  it('rejects relative paths and oversized output', async () => {
    await expect(
      appendGitHubSummary('relative.md', '# unsafe'),
    ).rejects.toThrow('Invalid GitHub step summary destination.');
    await expect(
      appendGitHubSummary(
        join(tmpdir(), 'large.md'),
        'x'.repeat(64 * 1024 + 1),
      ),
    ).rejects.toThrow('Invalid GitHub step summary destination.');
  });
});
