import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

import { APPROVED_LABELS } from '../../src/github/labels.js';
import { createFixtureAnalyzer } from '../../src/evaluation/fixtureProvider.js';
import {
  loadEvaluationDataset,
  loadFixtureDataset,
} from '../../src/evaluation/loadDataset.js';
import { renderEvaluationJson } from '../../src/evaluation/report.js';
import { runEvaluation } from '../../src/evaluation/runEvaluation.js';
import type { EvaluationReport } from '../../src/evaluation/evaluation.types.js';

const DATASET_PATH = fileURLToPath(
  new URL('../../evals/dataset/github-issues.json', import.meta.url),
);
const FIXTURE_PATH = fileURLToPath(
  new URL('../../evals/fixtures/normalized-decisions.json', import.meta.url),
);
const CONFIG = { autoThreshold: 0.9, reviewThreshold: 0.75 } as const;

function deterministicClock(): () => number {
  let value = 0;
  return () => {
    value += 1;
    return value;
  };
}

describe('offline fixture evaluation', () => {
  it('evaluates all 30 records in order through policy and label mapping', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);
    const fixtures = await loadFixtureDataset(FIXTURE_PATH, dataset);
    const fixtureAnalyzer = createFixtureAnalyzer(fixtures);
    const analyze = vi.fn(fixtureAnalyzer);

    const report = await runEvaluation({
      dataset,
      analyzer: analyze,
      mode: 'offline-fixture',
      config: CONFIG,
      now: deterministicClock(),
      timestamp: () => new Date('2026-09-26T00:00:00.000Z'),
    });

    expect(analyze).toHaveBeenCalledTimes(30);
    expect(report.mode).toBe('offline-fixture');
    expect(report.provider).toBe('synthetic-fixture');
    expect(report.datasetCount).toBe(30);
    expect(report.executedCount).toBe(30);
    expect(report.summary.accounting).toMatchObject({
      total: 30,
      succeeded: 30,
      failed: 0,
      skipped: 0,
    });
    expect(report.cases.map((result) => result.id)).toEqual(
      dataset.issues.map((issue) => issue.id),
    );
    for (const result of report.cases) {
      if (result.status === 'succeeded') {
        expect(
          result.proposedLabels.every((label) =>
            APPROVED_LABELS.includes(label),
          ),
        ).toBe(true);
        expect(result.providerLatencyMs).toBeNull();
      }
    }
  });

  it('continues after one sanitized per-case analyzer failure', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);
    const fixtures = await loadFixtureDataset(FIXTURE_PATH, dataset);
    const fixtureAnalyzer = createFixtureAnalyzer(fixtures);

    const report = await runEvaluation({
      dataset,
      analyzer: (issue, context) =>
        context.id === 'JF-002'
          ? Promise.reject(new Error('raw provider body and secret'))
          : fixtureAnalyzer(issue, context),
      mode: 'offline-fixture',
      config: CONFIG,
      limit: 3,
      now: deterministicClock(),
      timestamp: () => new Date('2026-09-26T00:00:00.000Z'),
    });

    expect(report.summary.accounting).toMatchObject({
      total: 3,
      succeeded: 2,
      failed: 1,
      failuresByCode: { unexpected_error: 1 },
    });
    expect(report.cases[1]).toEqual({
      id: 'JF-002',
      status: 'failed',
      errorCode: 'unexpected_error',
      evaluatorDurationMs: 1,
    });
    expect(renderEvaluationJson(report)).not.toContain(
      'raw provider body and secret',
    );
  });

  it('produces stable metrics and decisions for repeated fixed fixture runs', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);
    const fixtures = await loadFixtureDataset(FIXTURE_PATH, dataset);
    const analyzer = createFixtureAnalyzer(fixtures);
    const run = (): Promise<EvaluationReport> =>
      runEvaluation({
        dataset,
        analyzer,
        mode: 'offline-fixture',
        config: CONFIG,
        now: deterministicClock(),
        timestamp: () => new Date('2026-09-26T00:00:00.000Z'),
      });

    const first = await run();
    const second = await run();

    expect(second.summary).toEqual(first.summary);
    expect(second.cases).toEqual(first.cases);
  });

  it('does not duplicate raw issue title or body in machine-readable output', async () => {
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

    expect(json).not.toContain(dataset.issues[0]?.title);
    expect(json).not.toContain(dataset.issues[0]?.body);
    expect(json).toContain('JF-001');
  });
});
