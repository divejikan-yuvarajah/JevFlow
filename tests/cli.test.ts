import { describe, expect, it, vi } from 'vitest';

import { runBootstrap } from '../src/cli/bootstrap.js';

describe('bootstrap CLI', () => {
  it('runs without credentials and reports truthful offline release status', () => {
    const write = vi.fn<(message: string) => void>();
    runBootstrap({}, write);

    const output = write.mock.calls.flat().join('\n');
    expect(output).toContain('JevFlow — offline MVP ready for review');
    expect(output).toContain('no Jev/GitHub requests');
    expect(output).toContain('Jev integration: available through analyzeIssue');
    expect(output).toContain('Confidence policy and local label proposals');
    expect(output).toContain('GitHub automation: ready');
    expect(output).toContain('Offline synthetic evaluation harness: ready');
    expect(output).toContain('Web playground: ready');
    expect(output).toContain('Tasks 01–07 implemented locally');
    expect(output).toContain(
      'Live Jev, GitHub deployment, and public release: not verified',
    );
    expect(output).not.toMatch(
      /classified|label applied|API request completed/i,
    );
  });
});
