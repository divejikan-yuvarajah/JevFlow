import 'server-only';

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const MAX_REPORT_BYTES = 2 * 1024 * 1024;

export interface DisplayRatio {
  readonly numerator: number;
  readonly denominator: number;
  readonly rate: number | null;
}

export interface EvaluationDisplayReport {
  readonly mode: 'offline-fixture' | 'live-jev';
  readonly provider: 'synthetic-fixture' | 'typesafe-ai-jev';
  readonly datasetVersion: string;
  readonly datasetCount: number;
  readonly executedCount: number;
  readonly completedAt: string;
  readonly issueTypeAccuracy: DisplayRatio;
  readonly areaAccuracy: DisplayRatio;
  readonly priorityAccuracy: DisplayRatio;
  readonly exactAllThreeAccuracy: DisplayRatio;
  readonly automationCoverage: DisplayRatio;
  readonly averageSelectedProbability: number | null;
  readonly averageReportedConfidence: number | null;
  readonly probabilitySampleCount: number;
  readonly providerLatencyMs: {
    readonly average: number;
    readonly median: number;
    readonly p95: number;
  } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function finiteOrNull(value: unknown): value is number | null {
  return (
    value === null || (typeof value === 'number' && Number.isFinite(value))
  );
}

function ratio(value: unknown): DisplayRatio | null {
  if (
    !isRecord(value) ||
    !nonnegativeInteger(value.numerator) ||
    !nonnegativeInteger(value.denominator) ||
    !finiteOrNull(value.rate) ||
    (value.rate !== null && (value.rate < 0 || value.rate > 1)) ||
    value.numerator > value.denominator
  ) {
    return null;
  }
  return {
    numerator: value.numerator,
    denominator: value.denominator,
    rate: value.rate,
  };
}

function nestedRecord(
  root: Record<string, unknown>,
  ...keys: readonly string[]
): Record<string, unknown> | null {
  let current: unknown = root;
  for (const key of keys) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return isRecord(current) ? current : null;
}

function parseDisplayReport(value: unknown): EvaluationDisplayReport | null {
  if (!isRecord(value)) return null;
  const mode = value.mode;
  const provider = value.provider;
  if (
    value.schemaVersion !== '1.0' ||
    (mode !== 'offline-fixture' && mode !== 'live-jev') ||
    (provider !== 'synthetic-fixture' && provider !== 'typesafe-ai-jev') ||
    (mode === 'offline-fixture' && provider !== 'synthetic-fixture') ||
    (mode === 'live-jev' && provider !== 'typesafe-ai-jev') ||
    typeof value.datasetVersion !== 'string' ||
    value.datasetVersion.length > 40 ||
    !nonnegativeInteger(value.datasetCount) ||
    !nonnegativeInteger(value.executedCount) ||
    value.executedCount > value.datasetCount ||
    typeof value.completedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.completedAt))
  ) {
    return null;
  }

  const methodology = value.methodology;
  const summary = value.summary;
  if (
    !isRecord(methodology) ||
    methodology.annotations !== 'human-authored-synthetic' ||
    methodology.fixtureMeasurementsAreProviderPerformance !== false ||
    !isRecord(summary)
  ) {
    return null;
  }

  const type = nestedRecord(summary, 'classification', 'issueType');
  const area = nestedRecord(summary, 'classification', 'engineeringArea');
  const priority = nestedRecord(summary, 'classification', 'priority');
  const classification = nestedRecord(summary, 'classification');
  const automation = nestedRecord(summary, 'automation');
  const selected = nestedRecord(
    summary,
    'probabilities',
    'issueType',
    'selectedProbability',
  );
  const confidence = nestedRecord(
    summary,
    'probabilities',
    'issueType',
    'reportedConfidence',
  );
  const latency = nestedRecord(summary, 'latency');
  if (
    type === null ||
    area === null ||
    priority === null ||
    classification === null ||
    automation === null ||
    selected === null ||
    confidence === null ||
    latency === null
  ) {
    return null;
  }

  const issueTypeAccuracy = ratio(type.strictAccuracy);
  const areaAccuracy = ratio(area.strictAccuracy);
  const priorityAccuracy = ratio(priority.strictAccuracy);
  const exactAllThreeAccuracy = ratio(classification.exactAllThreeAccuracy);
  const automationCoverage = ratio(automation.automationCoverage);
  if (
    issueTypeAccuracy === null ||
    areaAccuracy === null ||
    priorityAccuracy === null ||
    exactAllThreeAccuracy === null ||
    automationCoverage === null ||
    !nonnegativeInteger(selected.count) ||
    !finiteOrNull(selected.average) ||
    !nonnegativeInteger(confidence.count) ||
    !finiteOrNull(confidence.average) ||
    selected.count !== confidence.count
  ) {
    return null;
  }

  let providerLatencyMs: EvaluationDisplayReport['providerLatencyMs'] = null;
  if (mode === 'live-jev') {
    const measured = latency.successfulProviderLatencyMs;
    if (isRecord(measured)) {
      const { average, median, p95 } = measured;
      if (
        typeof average === 'number' &&
        Number.isFinite(average) &&
        average >= 0 &&
        typeof median === 'number' &&
        Number.isFinite(median) &&
        median >= 0 &&
        typeof p95 === 'number' &&
        Number.isFinite(p95) &&
        p95 >= 0
      ) {
        providerLatencyMs = { average, median, p95 };
      }
    }
  }

  return {
    mode,
    provider,
    datasetVersion: value.datasetVersion,
    datasetCount: value.datasetCount,
    executedCount: value.executedCount,
    completedAt: value.completedAt,
    issueTypeAccuracy,
    areaAccuracy,
    priorityAccuracy,
    exactAllThreeAccuracy,
    automationCoverage,
    averageSelectedProbability: selected.average,
    averageReportedConfidence: confidence.average,
    probabilitySampleCount: selected.count,
    providerLatencyMs,
  };
}

export async function loadLatestEvaluationReport(
  repositoryRoot = resolve(process.cwd(), '..'),
): Promise<EvaluationDisplayReport | null> {
  const directory = join(repositoryRoot, 'evals', 'results');
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return null;
  }

  const candidates = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.json') &&
        !entry.name.startsWith('.'),
    )
    .slice(0, 20);
  const dated = await Promise.all(
    candidates.map(async (entry) => {
      const path = join(directory, entry.name);
      try {
        return { path, modified: (await stat(path)).mtimeMs };
      } catch {
        return null;
      }
    }),
  );

  for (const candidate of dated
    .filter(
      (entry): entry is { path: string; modified: number } => entry !== null,
    )
    .sort((left, right) => right.modified - left.modified)) {
    try {
      const file = await stat(candidate.path);
      if (file.size < 1 || file.size > MAX_REPORT_BYTES) continue;
      const text = await readFile(candidate.path, 'utf8');
      if (Buffer.byteLength(text, 'utf8') > MAX_REPORT_BYTES) continue;
      const report = parseDisplayReport(JSON.parse(text) as unknown);
      if (report !== null) return report;
    } catch {
      // Ignore malformed local artifacts and continue to the next safe candidate.
    }
  }
  return null;
}
