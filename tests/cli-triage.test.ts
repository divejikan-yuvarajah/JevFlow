import { describe, expect, it, vi } from 'vitest';

import { ConfigError } from '../src/config/env.js';
import { parseTriageArgs } from '../src/cli/triageArgs.js';
import {
  MAX_ISSUE_FILE_BYTES,
  loadIssueFile,
  type IssueFileAccess,
} from '../src/cli/triageFile.js';
import { runTriageCli } from '../src/cli/triage.js';
import { CliError, type IssueAnalyzer } from '../src/cli/triage.types.js';
import { createTriageResult } from './fixtures/triage-result.js';

const ISSUE = {
  title: 'Synthetic broken login',
  body: 'A synthetic issue body that must never be printed.',
  issueNumber: 42,
  repository: 'example/repo',
} as const;

const CONFIG = {
  autoThreshold: 0.9,
  reviewThreshold: 0.75,
} as const;

function writers(): {
  readonly stdout: ReturnType<typeof vi.fn<(text: string) => void>>;
  readonly stderr: ReturnType<typeof vi.fn<(text: string) => void>>;
} {
  return {
    stdout: vi.fn<(text: string) => void>(),
    stderr: vi.fn<(text: string) => void>(),
  };
}

describe('parseTriageArgs', () => {
  it('parses help, file, and JSON modes', () => {
    expect(parseTriageArgs(['--help'])).toEqual({ help: true });
    expect(parseTriageArgs(['--file', 'issue.json'])).toEqual({
      help: false,
      filePath: 'issue.json',
      json: false,
    });
    expect(parseTriageArgs(['--json', '--file', 'issue.json'])).toEqual({
      help: false,
      filePath: 'issue.json',
      json: true,
    });
  });

  it.each([
    [[]],
    [['--unknown']],
    [['--file']],
    [['--file', '--json']],
    [['--file', 'one.json', '--file', 'two.json']],
    [['--json', '--json', '--file', 'one.json']],
    [['--help', '--file', 'one.json']],
  ])('rejects invalid or ambiguous arguments', (args) => {
    expect(() => parseTriageArgs(args)).toThrow(CliError);
  });
});

describe('loadIssueFile', () => {
  it('loads one validated issue object', async () => {
    const access: IssueFileAccess = {
      getSize: vi.fn().mockResolvedValue(120),
      readText: vi.fn().mockResolvedValue(JSON.stringify(ISSUE)),
    };
    await expect(loadIssueFile('issue.json', access)).resolves.toEqual(ISSUE);
  });

  it('rejects oversized input before reading it', async () => {
    const readText = vi.fn().mockResolvedValue('{}');
    const access: IssueFileAccess = {
      getSize: vi.fn().mockResolvedValue(MAX_ISSUE_FILE_BYTES + 1),
      readText,
    };
    await expect(loadIssueFile('large.json', access)).rejects.toMatchObject({
      kind: 'input',
    });
    expect(readText).not.toHaveBeenCalled();
  });

  it('rejects input that grows beyond the limit after the size check', async () => {
    const contents = JSON.stringify({
      title: 'A valid title',
      body: 'x'.repeat(MAX_ISSUE_FILE_BYTES),
    });
    const access: IssueFileAccess = {
      getSize: vi.fn().mockResolvedValue(100),
      readText: vi.fn().mockResolvedValue(contents),
    };

    await expect(loadIssueFile('growing.json', access)).rejects.toMatchObject({
      kind: 'input',
    });
  });

  it.each(['not JSON', '[]', '{"body":"missing title"}'])(
    'rejects malformed JSON or the wrong shape',
    async (contents) => {
      const access: IssueFileAccess = {
        getSize: vi.fn().mockResolvedValue(Buffer.byteLength(contents)),
        readText: vi.fn().mockResolvedValue(contents),
      };
      await expect(loadIssueFile('bad.json', access)).rejects.toBeInstanceOf(
        CliError,
      );
    },
  );
});

describe('runTriageCli', () => {
  it('shows help without reading a file, loading config, or analyzing', async () => {
    const output = writers();
    const loadIssue = vi.fn();
    const analyze = vi.fn<IssueAnalyzer>();
    const getConfig = vi.fn();

    await expect(
      runTriageCli(['--help'], {
        ...output,
        loadIssue,
        analyze,
        getConfig,
      }),
    ).resolves.toBe(0);
    expect(output.stdout).toHaveBeenCalledOnce();
    expect(output.stdout.mock.calls[0]?.[0]).toContain('--file <issue.json>');
    expect(output.stderr).not.toHaveBeenCalled();
    expect(loadIssue).not.toHaveBeenCalled();
    expect(analyze).not.toHaveBeenCalled();
    expect(getConfig).not.toHaveBeenCalled();
  });

  it.each([[[]], [['--unknown']], [['--file']]])(
    'fails invalid usage before analysis',
    async (args) => {
      const output = writers();
      const analyze = vi.fn<IssueAnalyzer>();
      await expect(runTriageCli(args, { ...output, analyze })).resolves.toBe(2);
      expect(analyze).not.toHaveBeenCalled();
      expect(output.stdout).not.toHaveBeenCalled();
      expect(output.stderr).toHaveBeenCalledOnce();
    },
  );

  it('fails a missing file before analysis', async () => {
    const output = writers();
    const analyze = vi.fn<IssueAnalyzer>();
    await expect(
      runTriageCli(['--file', 'tests/fixtures/does-not-exist.json'], {
        ...output,
        analyze,
      }),
    ).resolves.toBe(2);
    expect(analyze).not.toHaveBeenCalled();
    expect(output.stderr.mock.calls[0]?.[0]).toContain('could not be read');
  });

  it('fails invalid configuration before analysis', async () => {
    const output = writers();
    const analyze = vi.fn<IssueAnalyzer>();
    await expect(
      runTriageCli(['--file', 'issue.json'], {
        ...output,
        loadIssue: vi.fn().mockResolvedValue(ISSUE),
        analyze,
        getConfig: () => {
          throw new ConfigError('AUTO_THRESHOLD must be valid.');
        },
      }),
    ).resolves.toBe(2);
    expect(analyze).not.toHaveBeenCalled();
    expect(output.stderr.mock.calls[0]?.[0]).toContain('Configuration error');
  });

  it('analyzes once and produces a human-readable local proposal', async () => {
    const output = writers();
    const result = createTriageResult({
      issueTypeProbability: 0.97,
      issueTypeConfidence: 0.95,
      securityProbabilityYes: 0.2,
    });
    const analyze = vi.fn<IssueAnalyzer>().mockResolvedValue(result);

    await expect(
      runTriageCli(['--file', 'issue.json'], {
        ...output,
        loadIssue: vi.fn().mockResolvedValue(ISSUE),
        analyze,
        getConfig: () => CONFIG,
      }),
    ).resolves.toBe(0);
    expect(analyze).toHaveBeenCalledOnce();
    expect(analyze).toHaveBeenCalledWith(ISSUE);
    const text = output.stdout.mock.calls[0]?.[0] ?? '';
    expect(text).toContain('selected probability: 0.970');
    expect(text).toContain('reported confidence: 0.950');
    expect(text).toContain('Security sensitive P(YES): 0.200');
    expect(text).toContain('Mode: auto');
    expect(text).toContain('Proposed labels: type:bug');
    expect(text).not.toContain(ISSUE.body);
    expect(output.stderr).not.toHaveBeenCalled();
  });

  it('writes exactly one safe parseable JSON document', async () => {
    const output = writers();
    const secret = 'must-not-appear';
    const analyze = vi
      .fn<IssueAnalyzer>()
      .mockResolvedValue(createTriageResult());

    await expect(
      runTriageCli(['--file', 'issue.json', '--json'], {
        ...output,
        loadIssue: vi.fn().mockResolvedValue({
          ...ISSUE,
          body: `${ISSUE.body} ${secret}`,
        }),
        analyze,
        getConfig: () => CONFIG,
      }),
    ).resolves.toBe(0);
    expect(output.stdout).toHaveBeenCalledOnce();
    const text = output.stdout.mock.calls[0]?.[0] ?? '';
    const document: unknown = JSON.parse(text);
    expect(document).toMatchObject({
      issueNumber: 42,
      policy: { mode: 'auto' },
      proposedLabels: [
        'type:bug',
        'area:backend',
        'priority:medium',
        'jev:auto-triaged',
      ],
    });
    expect(text).not.toContain(ISSUE.body);
    expect(text).not.toContain(secret);
    expect(output.stderr).not.toHaveBeenCalled();
  });

  it('sanitizes analyzer failures and emits no fabricated labels', async () => {
    const output = writers();
    const secret = 'provider-secret';
    const analyze = vi
      .fn<IssueAnalyzer>()
      .mockRejectedValue(new Error(`provider failed with ${secret}`));

    await expect(
      runTriageCli(['--file', 'issue.json'], {
        ...output,
        loadIssue: vi.fn().mockResolvedValue(ISSUE),
        analyze,
        getConfig: () => CONFIG,
      }),
    ).resolves.toBe(1);
    expect(analyze).toHaveBeenCalledOnce();
    expect(output.stdout).not.toHaveBeenCalled();
    const errorText = output.stderr.mock.calls[0]?.[0] ?? '';
    expect(errorText).toBe('Analysis failed safely.');
    expect(errorText).not.toContain(secret);
    expect(errorText).not.toContain('label');
  });

  it('returns a policy failure without labels for malformed normalized input', async () => {
    const output = writers();
    const analyze = vi
      .fn<IssueAnalyzer>()
      .mockResolvedValue(
        createTriageResult({ issueTypeConfidence: Number.NaN }),
      );
    await expect(
      runTriageCli(['--file', 'issue.json'], {
        ...output,
        loadIssue: vi.fn().mockResolvedValue(ISSUE),
        analyze,
        getConfig: () => CONFIG,
      }),
    ).resolves.toBe(1);
    expect(output.stdout).not.toHaveBeenCalled();
    expect(output.stderr.mock.calls[0]?.[0]).toContain('Policy error');
  });
});
