import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadLatestEvaluationReport } from '@/lib/evaluation-report';

const temporaryRoots: string[] = [];

async function temporaryRoot(): Promise<string> {
  const root = await mkdtemp(join(process.cwd(), '.evaluation-test-'));
  temporaryRoots.push(root);
  return root;
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => rm(root, { recursive: true, force: true })),
  );
});

function ratio(numerator: number, denominator: number) {
  return {
    numerator,
    denominator,
    rate: denominator === 0 ? null : numerator / denominator,
  };
}

function report() {
  return {
    schemaVersion: '1.0',
    mode: 'offline-fixture',
    provider: 'synthetic-fixture',
    datasetVersion: '2026.09.1',
    datasetCount: 30,
    executedCount: 30,
    completedAt: '2026-09-26T17:57:39.208Z',
    summary: {
      classification: {
        issueType: { strictAccuracy: ratio(29, 30) },
        engineeringArea: { strictAccuracy: ratio(26, 30) },
        priority: { strictAccuracy: ratio(27, 30) },
        exactAllThreeAccuracy: ratio(23, 30),
      },
      automation: { automationCoverage: ratio(12, 30) },
      probabilities: {
        issueType: {
          selectedProbability: { count: 30, average: 0.91 },
          reportedConfidence: { count: 30, average: 0.88 },
        },
      },
      latency: {
        successfulProviderLatencyMs: null,
      },
    },
    methodology: {
      annotations: 'human-authored-synthetic',
      fixtureMeasurementsAreProviderPerformance: false,
    },
  };
}

describe('evaluation artifact loader', () => {
  it('returns an honest empty result when no report exists', async () => {
    expect(await loadLatestEvaluationReport(await temporaryRoot())).toBeNull();
  });

  it('projects a valid persisted report without cases or paths', async () => {
    const root = await temporaryRoot();
    const directory = join(root, 'evals', 'results');
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, 'report.json'), JSON.stringify(report()));
    const result = await loadLatestEvaluationReport(root);
    expect(result).toMatchObject({
      mode: 'offline-fixture',
      datasetCount: 30,
      exactAllThreeAccuracy: ratio(23, 30),
      providerLatencyMs: null,
    });
    expect(result).not.toHaveProperty('cases');
    expect(result).not.toHaveProperty('path');
  });

  it('ignores malformed or misleading artifacts', async () => {
    const root = await temporaryRoot();
    const directory = join(root, 'evals', 'results');
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, 'bad.json'),
      JSON.stringify({
        ...report(),
        methodology: {
          annotations: 'private-production-data',
          fixtureMeasurementsAreProviderPerformance: true,
        },
      }),
    );
    expect(await loadLatestEvaluationReport(root)).toBeNull();
  });
});
