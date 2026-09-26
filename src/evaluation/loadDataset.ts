import { readFile, stat } from 'node:fs/promises';

import {
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
  isEngineeringArea,
  isIssuePriority,
  isIssueType,
} from '../domain/constants.js';
import {
  EVALUATION_DATASET_SIZE,
  EVALUATION_SCHEMA_VERSION,
  EvaluationError,
  type EvaluationDataset,
  type EvaluationExpectation,
  type EvaluationIssue,
  type FixtureChoice,
  type FixtureDataset,
  type NormalizedDecisionFixture,
} from './evaluation.types.js';

const MAX_EVALUATION_FILE_BYTES = 2 * 1024 * 1024;
const DATASET_VERSION_PATTERN = /^\d{4}\.\d{2}\.\d+$/u;
const RECORD_ID_PATTERN = /^JF-(?:00[1-9]|0[12][0-9]|030)$/u;
const TAG_PATTERN = /^[a-z][a-z0-9-]{0,39}$/u;
const CREDENTIAL_PATTERN =
  /(?:ghp_[A-Za-z0-9]{10,}|github_pat_[A-Za-z0-9_]{10,}|sk-[A-Za-z0-9]{12,}|AIza[A-Za-z0-9_-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/u;
const PRIVATE_ISSUE_URL_PATTERN =
  /https?:\/\/(?:www\.)?github\.com\/[^\s/]+\/[^\s/]+\/(?:issues|pull)\/\d+/iu;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidDataset(message: string): never {
  throw new EvaluationError('invalid_dataset', message);
}

function invalidFixtures(message: string): never {
  throw new EvaluationError('invalid_fixtures', message);
}

function requireString(
  value: unknown,
  field: string,
  allowEmpty = false,
): string {
  if (
    typeof value !== 'string' ||
    (!allowEmpty && value.trim() === '') ||
    value.length > 10_000
  ) {
    return invalidDataset(`${field} must be a valid string.`);
  }
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    return invalidDataset(`${field} must be boolean.`);
  }
  return value;
}

function requireProbability(value: unknown, field: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    return invalidFixtures(`${field} must be a probability from 0 to 1.`);
  }
  return value;
}

function validateExpectation(
  value: unknown,
  id: string,
): EvaluationExpectation {
  if (!isRecord(value)) return invalidDataset(`${id}.expected is invalid.`);
  if (typeof value.issueType !== 'string' || !isIssueType(value.issueType)) {
    return invalidDataset(`${id}.expected.issueType is unsupported.`);
  }
  if (
    typeof value.engineeringArea !== 'string' ||
    !isEngineeringArea(value.engineeringArea)
  ) {
    return invalidDataset(`${id}.expected.engineeringArea is unsupported.`);
  }
  if (typeof value.priority !== 'string' || !isIssuePriority(value.priority)) {
    return invalidDataset(`${id}.expected.priority is unsupported.`);
  }
  const annotationConfidence = value.annotationConfidence;
  if (
    annotationConfidence !== 'high' &&
    annotationConfidence !== 'medium' &&
    annotationConfidence !== 'low'
  ) {
    return invalidDataset(`${id}.expected.annotationConfidence is invalid.`);
  }

  let acceptableAlternativeAreas:
    readonly (typeof ENGINEERING_AREAS)[number][] | undefined;
  if (value.acceptableAlternativeAreas !== undefined) {
    if (
      !Array.isArray(value.acceptableAlternativeAreas) ||
      value.acceptableAlternativeAreas.length === 0 ||
      value.acceptableAlternativeAreas.some(
        (area) => typeof area !== 'string' || !isEngineeringArea(area),
      )
    ) {
      return invalidDataset(
        `${id}.expected.acceptableAlternativeAreas is invalid.`,
      );
    }
    const alternatives = value.acceptableAlternativeAreas as string[];
    if (
      new Set(alternatives).size !== alternatives.length ||
      alternatives.includes(value.engineeringArea)
    ) {
      return invalidDataset(
        `${id}.expected.acceptableAlternativeAreas is contradictory.`,
      );
    }
    acceptableAlternativeAreas = alternatives.filter(isEngineeringArea);
  }

  const rationale = requireString(
    value.rationale,
    `${id}.expected.rationale`,
  ).trim();
  return {
    issueType: value.issueType,
    engineeringArea: value.engineeringArea,
    priority: value.priority,
    securitySensitive: requireBoolean(
      value.securitySensitive,
      `${id}.expected.securitySensitive`,
    ),
    needsHumanReview: requireBoolean(
      value.needsHumanReview,
      `${id}.expected.needsHumanReview`,
    ),
    ...(acceptableAlternativeAreas === undefined
      ? {}
      : { acceptableAlternativeAreas }),
    annotationConfidence,
    rationale,
  };
}

function validateIssue(value: unknown): EvaluationIssue {
  if (!isRecord(value)) return invalidDataset('Each issue must be an object.');
  const id = requireString(value.id, 'issue.id').trim();
  if (!RECORD_ID_PATTERN.test(id)) {
    return invalidDataset(
      'Issue IDs must use the stable JF-001..JF-030 range.',
    );
  }
  const title = requireString(value.title, `${id}.title`).trim();
  if (Array.from(title).length > 300) {
    return invalidDataset(`${id}.title exceeds 300 code points.`);
  }
  const body = requireString(value.body, `${id}.body`, true);
  if (Array.from(body).length > 8_000) {
    return invalidDataset(`${id}.body exceeds the committed dataset limit.`);
  }
  if (
    CREDENTIAL_PATTERN.test(`${title}\n${body}`) ||
    PRIVATE_ISSUE_URL_PATTERN.test(`${title}\n${body}`)
  ) {
    return invalidDataset(
      `${id} contains credential-like or private URL data.`,
    );
  }
  if (
    !Array.isArray(value.tags) ||
    value.tags.length === 0 ||
    value.tags.some(
      (tag) => typeof tag !== 'string' || !TAG_PATTERN.test(tag),
    ) ||
    new Set(value.tags).size !== value.tags.length
  ) {
    return invalidDataset(`${id}.tags must be unique normalized tags.`);
  }
  return {
    id,
    title,
    body,
    tags: [...(value.tags as string[])],
    expected: validateExpectation(value.expected, id),
  };
}

export function validateEvaluationDataset(value: unknown): EvaluationDataset {
  if (!isRecord(value))
    return invalidDataset('Dataset root must be an object.');
  if (value.schemaVersion !== EVALUATION_SCHEMA_VERSION) {
    return invalidDataset('Dataset schemaVersion is unsupported.');
  }
  if (
    typeof value.datasetVersion !== 'string' ||
    !DATASET_VERSION_PATTERN.test(value.datasetVersion)
  ) {
    return invalidDataset('Dataset version must use YYYY.MM.revision.');
  }
  const description = requireString(value.description, 'description').trim();
  if (
    !Array.isArray(value.issues) ||
    value.issues.length !== EVALUATION_DATASET_SIZE
  ) {
    return invalidDataset(
      `Dataset must contain exactly ${String(EVALUATION_DATASET_SIZE)} issues.`,
    );
  }
  const issues = value.issues.map(validateIssue);
  const ids = issues.map((issue) => issue.id);
  if (new Set(ids).size !== ids.length) {
    return invalidDataset('Dataset issue IDs must be unique.');
  }
  for (let index = 0; index < EVALUATION_DATASET_SIZE; index += 1) {
    const expectedId = `JF-${String(index + 1).padStart(3, '0')}`;
    if (issues[index]?.id !== expectedId) {
      return invalidDataset(
        'Dataset issues must be ordered JF-001 through JF-030.',
      );
    }
  }
  return {
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    datasetVersion: value.datasetVersion,
    description,
    issues,
  };
}

function validateFixtureChoice<T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
): FixtureChoice<T> {
  if (
    !isRecord(value) ||
    typeof value.value !== 'string' ||
    !allowed.includes(value.value as T)
  ) {
    return invalidFixtures(`${field}.value is unsupported.`);
  }
  return {
    value: value.value as T,
    selectedProbability: requireProbability(
      value.selectedProbability,
      `${field}.selectedProbability`,
    ),
    confidence: requireProbability(value.confidence, `${field}.confidence`),
  };
}

function validateFixture(value: unknown): NormalizedDecisionFixture {
  if (!isRecord(value))
    return invalidFixtures('Each fixture must be an object.');
  if (typeof value.id !== 'string' || !RECORD_ID_PATTERN.test(value.id)) {
    return invalidFixtures('Fixture ID is invalid.');
  }
  if (typeof value.inputTruncated !== 'boolean') {
    return invalidFixtures(`${value.id}.inputTruncated must be boolean.`);
  }
  return {
    id: value.id,
    issueType: validateFixtureChoice(
      value.issueType,
      `${value.id}.issueType`,
      ISSUE_TYPES,
    ),
    engineeringArea: validateFixtureChoice(
      value.engineeringArea,
      `${value.id}.engineeringArea`,
      ENGINEERING_AREAS,
    ),
    priority: validateFixtureChoice(
      value.priority,
      `${value.id}.priority`,
      PRIORITIES,
    ),
    securityProbabilityYes: requireProbability(
      value.securityProbabilityYes,
      `${value.id}.securityProbabilityYes`,
    ),
    humanReviewProbabilityYes: requireProbability(
      value.humanReviewProbabilityYes,
      `${value.id}.humanReviewProbabilityYes`,
    ),
    inputTruncated: value.inputTruncated,
  };
}

export function validateFixtureDataset(
  value: unknown,
  dataset: EvaluationDataset,
): FixtureDataset {
  if (!isRecord(value))
    return invalidFixtures('Fixture root must be an object.');
  if (
    value.schemaVersion !== EVALUATION_SCHEMA_VERSION ||
    value.provider !== 'synthetic-fixture' ||
    value.datasetVersion !== dataset.datasetVersion ||
    typeof value.description !== 'string' ||
    value.description.trim() === '' ||
    !Array.isArray(value.fixtures)
  ) {
    return invalidFixtures('Fixture metadata is invalid or mismatched.');
  }
  const fixtures = value.fixtures.map(validateFixture);
  const fixtureIds = fixtures.map((fixture) => fixture.id);
  const datasetIds = dataset.issues.map((issue) => issue.id);
  if (
    fixtures.length !== dataset.issues.length ||
    new Set(fixtureIds).size !== fixtureIds.length ||
    fixtureIds.some((id, index) => id !== datasetIds[index])
  ) {
    return invalidFixtures(
      'Fixtures must map one-to-one in deterministic dataset order.',
    );
  }
  return {
    schemaVersion: EVALUATION_SCHEMA_VERSION,
    datasetVersion: value.datasetVersion,
    provider: 'synthetic-fixture',
    description: value.description,
    fixtures,
  };
}

async function readBoundedJson(
  path: string,
  errorCode: 'invalid_dataset' | 'invalid_fixtures',
): Promise<unknown> {
  try {
    const size = (await stat(path)).size;
    if (size < 1 || size > MAX_EVALUATION_FILE_BYTES) throw new Error('size');
    const text = await readFile(path, 'utf8');
    if (Buffer.byteLength(text, 'utf8') > MAX_EVALUATION_FILE_BYTES) {
      throw new Error('size');
    }
    return JSON.parse(text) as unknown;
  } catch {
    throw new EvaluationError(
      errorCode,
      errorCode === 'invalid_dataset'
        ? 'Evaluation dataset could not be loaded.'
        : 'Evaluation fixtures could not be loaded.',
    );
  }
}

export async function loadEvaluationDataset(
  path: string,
): Promise<EvaluationDataset> {
  return validateEvaluationDataset(
    await readBoundedJson(path, 'invalid_dataset'),
  );
}

export async function loadFixtureDataset(
  path: string,
  dataset: EvaluationDataset,
): Promise<FixtureDataset> {
  return validateFixtureDataset(
    await readBoundedJson(path, 'invalid_fixtures'),
    dataset,
  );
}
