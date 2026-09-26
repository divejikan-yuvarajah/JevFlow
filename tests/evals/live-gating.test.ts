import { randomUUID } from 'node:crypto';
import { rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { runEvaluationCli } from '../../src/cli/evaluate.js';
import { createTriageResult } from '../fixtures/triage-result.js';

const TEMP_PATHS: string[] = [];

afterEach(async () => {
  await Promise.all(
    TEMP_PATHS.splice(0).map((path) => rm(path, { force: true })),
  );
});

describe('evaluation CLI safety gates', () => {
  it('shows help without credentials, files, or analyzer creation', async () => {
    const stdout = vi.fn();
    const liveAnalyzer = vi.fn();
    const fixtureAnalyzerFactory = vi.fn();

    const exitCode = await runEvaluationCli(['--help'], {
      cwd: 'Z:\\path-that-does-not-exist',
      env: {},
      stdout,
      stderr: vi.fn(),
      liveAnalyzer,
      fixtureAnalyzerFactory,
    });

    expect(exitCode).toBe(0);
    expect(stdout.mock.calls[0]?.[0]).toContain('--confirm-live');
    expect(liveAnalyzer).not.toHaveBeenCalled();
    expect(fixtureAnalyzerFactory).not.toHaveBeenCalled();
  });

  it('refuses live mode before file, key, or analyzer access without confirmation', async () => {
    const stderr = vi.fn();
    const liveAnalyzer = vi.fn();
    const loadEnvironment = vi.fn().mockResolvedValue(undefined);

    const exitCode = await runEvaluationCli(['--mode', 'live'], {
      cwd: 'Z:\\path-that-does-not-exist',
      stdout: vi.fn(),
      stderr,
      liveAnalyzer,
      loadEnvironment,
    });

    expect(exitCode).toBe(1);
    expect(stderr.mock.calls[0]?.[0]).toContain(
      'Live mode can make up to 30 paid Jev requests',
    );
    expect(liveAnalyzer).not.toHaveBeenCalled();
    expect(loadEnvironment).not.toHaveBeenCalled();
  });

  it('rejects unknown arguments and unsafe output paths before analysis', async () => {
    const liveAnalyzer = vi.fn();
    await expect(
      runEvaluationCli(['--unknown'], {
        stdout: vi.fn(),
        stderr: vi.fn(),
        liveAnalyzer,
      }),
    ).resolves.toBe(2);
    await expect(
      runEvaluationCli(['--output', '../outside.md'], {
        stdout: vi.fn(),
        stderr: vi.fn(),
        liveAnalyzer,
      }),
    ).resolves.toBe(1);
    expect(liveAnalyzer).not.toHaveBeenCalled();
  });

  it('rejects malformed datasets without invoking a confirmed live analyzer', async () => {
    const malformed = join(
      tmpdir(),
      `jevflow-invalid-dataset-${randomUUID()}.json`,
    );
    TEMP_PATHS.push(malformed);
    await writeFile(malformed, '{ invalid', 'utf8');
    const liveAnalyzer = vi.fn();

    const exitCode = await runEvaluationCli(
      [
        '--mode',
        'live',
        '--confirm-live',
        '--limit',
        '1',
        '--dataset',
        malformed,
      ],
      {
        env: { TYPESAFE_API_KEY: 'offline-test-placeholder' },
        stdout: vi.fn(),
        stderr: vi.fn(),
        liveAnalyzer,
      },
    );

    expect(exitCode).toBe(1);
    expect(liveAnalyzer).not.toHaveBeenCalled();
  });

  it('uses an injected analyzer only after explicit live confirmation', async () => {
    const liveAnalyzer = vi.fn().mockResolvedValue(createTriageResult());
    const stdout = vi.fn();

    const exitCode = await runEvaluationCli(
      ['--mode', 'live', '--confirm-live', '--limit', '1', '--format', 'json'],
      {
        env: { TYPESAFE_API_KEY: 'offline-test-placeholder' },
        stdout,
        stderr: vi.fn(),
        liveAnalyzer,
      },
    );

    expect(exitCode).toBe(0);
    expect(liveAnalyzer).toHaveBeenCalledOnce();
    const report = JSON.parse(String(stdout.mock.calls[0]?.[0])) as {
      mode: string;
      executedCount: number;
    };
    expect(report).toMatchObject({ mode: 'live-jev', executedCount: 1 });
  });

  it('requires a key only after live mode is explicitly confirmed', async () => {
    const liveAnalyzer = vi.fn();
    const stderr = vi.fn();

    const exitCode = await runEvaluationCli(
      ['--mode', 'live', '--confirm-live', '--limit', '1'],
      {
        env: {},
        stdout: vi.fn(),
        stderr,
        liveAnalyzer,
      },
    );

    expect(exitCode).toBe(1);
    expect(liveAnalyzer).not.toHaveBeenCalled();
    expect(stderr.mock.calls[0]?.[0]).toContain('missing_api_key');
  });

  it('never selects the live analyzer in fixture mode even when a key exists', async () => {
    const liveAnalyzer = vi.fn();

    const exitCode = await runEvaluationCli(
      ['--mode', 'fixture', '--limit', '1', '--format', 'json'],
      {
        env: { TYPESAFE_API_KEY: 'configured-but-unused-placeholder' },
        stdout: vi.fn(),
        stderr: vi.fn(),
        liveAnalyzer,
      },
    );

    expect(exitCode).toBe(0);
    expect(liveAnalyzer).not.toHaveBeenCalled();
  });
});
