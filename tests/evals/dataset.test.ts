import { rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { MAX_BODY_CODE_POINTS, buildJevState } from '../../src/jev/state.js';
import {
  loadEvaluationDataset,
  loadFixtureDataset,
  validateEvaluationDataset,
  validateFixtureDataset,
} from '../../src/evaluation/loadDataset.js';
import { EvaluationError } from '../../src/evaluation/evaluation.types.js';
import { fixtureToTriageResult } from '../../src/evaluation/fixtureProvider.js';

const DATASET_PATH = fileURLToPath(
  new URL('../../evals/dataset/github-issues.json', import.meta.url),
);
const FIXTURE_PATH = fileURLToPath(
  new URL('../../evals/fixtures/normalized-decisions.json', import.meta.url),
);
const TEMP_PATHS: string[] = [];

afterEach(async () => {
  await Promise.all(
    TEMP_PATHS.splice(0).map((path) => rm(path, { force: true })),
  );
});

function mutableClone(value: unknown): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

describe('evaluation dataset', () => {
  it('loads exactly 30 ordered unique synthetic cases', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);

    expect(dataset.schemaVersion).toBe('1.0');
    expect(dataset.issues).toHaveLength(30);
    expect(dataset.issues[0]?.id).toBe('JF-001');
    expect(dataset.issues[29]?.id).toBe('JF-030');
    expect(new Set(dataset.issues.map((issue) => issue.id)).size).toBe(30);
    expect(dataset.description).toContain('synthetic');
  });

  it('contains Unicode, multiline, empty-body, ambiguity, AI, and security cohorts', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);

    expect(
      dataset.issues.some((issue) =>
        Array.from(issue.title + issue.body).some(
          (character) => (character.codePointAt(0) ?? 0) > 127,
        ),
      ),
    ).toBe(true);
    expect(dataset.issues.some((issue) => issue.body.includes('\n'))).toBe(
      true,
    );
    expect(dataset.issues.some((issue) => issue.body === '')).toBe(true);
    expect(
      dataset.issues.some((issue) => issue.tags.includes('ambiguous')),
    ).toBe(true);
    expect(dataset.issues.some((issue) => issue.tags.includes('ai'))).toBe(
      true,
    );
    expect(
      dataset.issues.filter((issue) => issue.expected.securitySensitive).length,
    ).toBeGreaterThanOrEqual(5);
  });

  it('loads one fixture for every dataset case in the same order', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);
    const fixtures = await loadFixtureDataset(FIXTURE_PATH, dataset);

    expect(fixtures.provider).toBe('synthetic-fixture');
    expect(fixtures.fixtures.map((fixture) => fixture.id)).toEqual(
      dataset.issues.map((issue) => issue.id),
    );
    for (const fixture of fixtures.fixtures) {
      const result = fixtureToTriageResult(fixture);
      for (const probabilities of [
        result.issueType.probabilities,
        result.engineeringArea.probabilities,
        result.priority.probabilities,
      ]) {
        expect(
          Object.values(probabilities).reduce(
            (total, probability) => total + probability,
            0,
          ),
        ).toBeCloseTo(1);
      }
    }
  });

  it('rejects missing records, duplicate IDs, invalid categories, and contradictory alternatives', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);

    const missing = mutableClone(dataset);
    (missing.issues as unknown[]).pop();
    expect(() => validateEvaluationDataset(missing)).toThrow(EvaluationError);

    const duplicate = mutableClone(dataset);
    const duplicateIssues = duplicate.issues as Record<string, unknown>[];
    duplicateIssues[1] = { ...duplicateIssues[1], id: 'JF-001' };
    expect(() => validateEvaluationDataset(duplicate)).toThrow(EvaluationError);

    const invalidCategory = mutableClone(dataset);
    const invalidExpected = (
      invalidCategory.issues as Record<string, unknown>[]
    )[0]?.expected as Record<string, unknown>;
    invalidExpected.issueType = 'incident';
    expect(() => validateEvaluationDataset(invalidCategory)).toThrow(
      EvaluationError,
    );

    const contradictory = mutableClone(dataset);
    const contradictoryExpected = (
      contradictory.issues as Record<string, unknown>[]
    )[0]?.expected as Record<string, unknown>;
    contradictoryExpected.acceptableAlternativeAreas = ['backend'];
    expect(() => validateEvaluationDataset(contradictory)).toThrow(
      EvaluationError,
    );
  });

  it('rejects missing title/body and credential-like strings', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);

    const missingTitle = mutableClone(dataset);
    (missingTitle.issues as Record<string, unknown>[])[0] = {
      ...(missingTitle.issues as Record<string, unknown>[])[0],
      title: '',
    };
    expect(() => validateEvaluationDataset(missingTitle)).toThrow(
      EvaluationError,
    );

    const missingBody = mutableClone(dataset);
    delete (missingBody.issues as Record<string, unknown>[])[0]?.body;
    expect(() => validateEvaluationDataset(missingBody)).toThrow(
      EvaluationError,
    );

    const credential = mutableClone(dataset);
    (credential.issues as Record<string, unknown>[])[0] = {
      ...(credential.issues as Record<string, unknown>[])[0],
      body: `Accidental token ${['ghp', '_'].join('')}1234567890abcdef`,
    };
    expect(() => validateEvaluationDataset(credential)).toThrow(
      EvaluationError,
    );

    const invalidBoolean = mutableClone(dataset);
    const invalidBooleanExpected = (
      invalidBoolean.issues as Record<string, unknown>[]
    )[0]?.expected as Record<string, unknown>;
    invalidBooleanExpected.securitySensitive = 'yes';
    expect(() => validateEvaluationDataset(invalidBoolean)).toThrow(
      EvaluationError,
    );

    const missingRationale = mutableClone(dataset);
    const missingRationaleExpected = (
      missingRationale.issues as Record<string, unknown>[]
    )[0]?.expected as Record<string, unknown>;
    missingRationaleExpected.rationale = '';
    expect(() => validateEvaluationDataset(missingRationale)).toThrow(
      EvaluationError,
    );
  });

  it('rejects duplicate, unknown, missing, and malformed fixtures', async () => {
    const dataset = await loadEvaluationDataset(DATASET_PATH);
    const fixtures = await loadFixtureDataset(FIXTURE_PATH, dataset);

    const duplicate = mutableClone(fixtures);
    const duplicateFixtures = duplicate.fixtures as Record<string, unknown>[];
    duplicateFixtures[1] = { ...duplicateFixtures[1], id: 'JF-001' };
    expect(() => validateFixtureDataset(duplicate, dataset)).toThrow(
      EvaluationError,
    );

    const unknown = mutableClone(fixtures);
    const unknownFixtures = unknown.fixtures as Record<string, unknown>[];
    unknownFixtures[0] = { ...unknownFixtures[0], id: 'JF-999' };
    expect(() => validateFixtureDataset(unknown, dataset)).toThrow(
      EvaluationError,
    );

    const missing = mutableClone(fixtures);
    (missing.fixtures as unknown[]).pop();
    expect(() => validateFixtureDataset(missing, dataset)).toThrow(
      EvaluationError,
    );

    const invalidProbability = mutableClone(fixtures);
    const first = (invalidProbability.fixtures as Record<string, unknown>[])[0];
    (first?.issueType as Record<string, unknown>).selectedProbability = 1.5;
    expect(() => validateFixtureDataset(invalidProbability, dataset)).toThrow(
      EvaluationError,
    );
  });

  it('sanitizes malformed JSON load errors', async () => {
    const path = join(tmpdir(), `jevflow-eval-malformed-${randomUUID()}.json`);
    TEMP_PATHS.push(path);
    await writeFile(path, '{ invalid', 'utf8');

    await expect(loadEvaluationDataset(path)).rejects.toMatchObject({
      code: 'invalid_dataset',
      message: 'Evaluation dataset could not be loaded.',
    });
  });

  it('handles generated oversized Unicode input through the canonical truncation path', () => {
    const body = '🚀'.repeat(MAX_BODY_CODE_POINTS + 5);
    const built = buildJevState({ title: 'Generated truncation case', body });

    expect(built.inputTruncated).toBe(true);
    expect(built.truncatedFields).toEqual(['body']);
    expect(Array.from(built.state.body)).toHaveLength(MAX_BODY_CODE_POINTS);
  });
});
