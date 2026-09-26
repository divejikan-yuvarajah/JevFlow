import { describe, expect, it, vi } from 'vitest';

import { runBootstrap } from '../src/cli/bootstrap.js';

describe('bootstrap CLI', () => {
  it('runs without credentials and reports only foundation behavior', () => {
    const write = vi.fn<(message: string) => void>();
    runBootstrap({}, write);

    const output = write.mock.calls.flat().join('\n');
    expect(output).toContain('JevFlow — foundation ready');
    expect(output).toContain('no Jev/GitHub requests');
    expect(output).toContain('Jev integration: available through analyzeIssue');
    expect(output).toContain('Confidence policy and local label proposals');
    expect(output).toContain('GitHub automation: ready');
    expect(output).toContain('Offline synthetic evaluation harness: ready');
    expect(output).toContain('Web playground: ready');
    expect(output).toContain('Task 07 — documentation');
    expect(output).not.toMatch(
      /classified|label applied|API request completed/i,
    );
  });
});
