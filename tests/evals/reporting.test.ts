import { randomUUID } from 'node:crypto';
import { readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { runEvaluationCli } from '../../src/cli/evaluate.js';
import { createFixtureAnalyzer } from '../../src/evaluation/fixtureProvider.js';
import {
  loadEvaluationDataset,
  loadFixtureDataset,
} from '../../src/evaluation/loadDataset.js';
import {
  renderEvaluationJson,
  renderEvaluationMarkdown,
} from '../../src/evaluation/report.js';
import { runEvaluation } from '../../src/evaluation/runEvaluation.js';
import { createTriageResult } from '../fixtures/triage-result.js';

const DATASET_PATH = fileURLToPath(
  new URL('../../evals/dataset/github-issues.json', import.meta.url),
);
const FIXTURE_PATH = fileURLToPath(
  new URL('../../evals/fixtures/normalized-decisions.json', import.meta.url),
);
const CONFIG = { autoThreshold: 0.9, reviewThreshold: 0.75 } as const;
const TEMP_DIRECTORIES: string[] = [];

afterEach(async () => {
  await Promise.all(
    TEMP_DIRECTORIES.splice(0).map((path) =>
      rm(path, { recursive: true, force: true }),
    ),
  );
});

describe('evaluation reports', () => {
  it('labels fixture output explicitly and keeps latency semantics truthful', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);
    const fixtures = await loadFixtureDataset(FIXTURE_PATH, dataset);
    const report = await runEvaluation({
      dataset,
      analyzer: createFixtureAnalyzer(fixtures),
      mode: 'offline-fixture',
      config: CONFIG,
      limit: 2,
    });

    const markdown = renderEvaluationMarkdown(report);
    expect(markdown).toContain('OFFLINE SYNTHETIC FIXTURE EVALUATION');
    expect(markdown).toContain('Issue type selected probability');
    expect(markdown).toContain('Issue type reported confidence');
    expect(markdown).toContain('Security P(YES)');
    expect(markdown).toContain('Jev provider latency: N/A');
    expect(markdown).toContain('2/2');
    expect(markdown).not.toContain(dataset.issues[0]?.body);
  });

  it('serializes valid JSON without non-finite values, raw issue text, or secrets', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);
    const fixtures = await loadFixtureDataset(FIXTURE_PATH, dataset);
    const report = await runEvaluation({
      dataset,
      analyzer: createFixtureAnalyzer(fixtures),
      mode: 'offline-fixture',
      config: CONFIG,
      limit: 1,
    });

    const json = renderEvaluationJson(report);
    expect(() => JSON.parse(json) as unknown).not.toThrow();
    expect(json).not.toMatch(/NaN|Infinity|secret-value/u);
    expect(json).not.toContain(dataset.issues[0]?.title);
    expect(json).not.toContain(dataset.issues[0]?.body);
  });

  it('reports observed provider latency only in live mode', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);
    const report = await runEvaluation({
      dataset,
      analyzer: vi.fn().mockResolvedValue(
        createTriageResult({
          issueType: 'bug',
          engineeringArea: 'backend',
          priority: 'high',
        }),
      ),
      mode: 'live-jev',
      config: CONFIG,
      limit: 1,
    });

    expect(report.summary.latency.successfulProviderLatencyMs).toMatchObject({
      count: 1,
      average: 12.5,
      median: 12.5,
      p95: 12.5,
    });
    expect(renderEvaluationMarkdown(report)).toContain('LIVE Jev EVALUATION');
  });

  it('writes a machine-readable report to an explicit safe workspace path', async () => {
    const cwd = join(tmpdir(), `jevflow-eval-${randomUUID()}`);
    TEMP_DIRECTORIES.push(cwd);
    const output = join(cwd, 'report.json');
    const stdout = vi.fn();

    const exitCode = await runEvaluationCli(
      [
        '--mode',
        'fixture',
        '--format',
        'json',
        '--dataset',
        DATASET_PATH,
        '--fixtures',
        FIXTURE_PATH,
        '--output',
        'report.json',
      ],
      { cwd, stdout, stderr: vi.fn(), env: {} },
    );

    expect(exitCode).toBe(0);
    const parsed = JSON.parse(await readFile(output, 'utf8')) as {
      mode: string;
      datasetCount: number;
    };
    expect(parsed).toMatchObject({
      mode: 'offline-fixture',
      datasetCount: 30,
    });
    expect(stdout).toHaveBeenCalledWith(
      'Evaluation report written: report.json',
    );
  });
});
