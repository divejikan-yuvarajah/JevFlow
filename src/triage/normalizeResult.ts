import {
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
  type EngineeringArea,
  type IssuePriority,
  type IssueType,
} from '../domain/constants.js';
import type { TruncatedField } from '../jev/state.js';
import {
  TriageError,
  type ChoiceDecision,
  type TriageResult,
} from './triage.types.js';

export interface NormalizationMetadata {
  readonly latencyMs: number;
  readonly inputTruncated: boolean;
  readonly truncatedFields: readonly TruncatedField[];
}

interface ValidatedNormalizationMetadata {
  readonly latencyMs: number;
  readonly inputTruncated: boolean;
  readonly truncatedFields: readonly TruncatedField[];
}

function invalidResponse(field: string): never {
  throw new TriageError(
    'invalid_response',
    `The Jev response has an invalid ${field}.`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function unitProbability(value: unknown, field: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    return invalidResponse(field);
  }
  return value;
}

function nonnegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    return invalidResponse(field);
  }
  return value;
}

function normalizeMetadata(metadata: unknown): ValidatedNormalizationMetadata {
  if (!isRecord(metadata)) return invalidResponse('normalization metadata');
  if (
    typeof metadata.latencyMs !== 'number' ||
    !Number.isFinite(metadata.latencyMs) ||
    metadata.latencyMs < 0
  ) {
    return invalidResponse('latency metadata');
  }
  if (
    typeof metadata.inputTruncated !== 'boolean' ||
    !isUnknownArray(metadata.truncatedFields)
  ) {
    return invalidResponse('truncation metadata');
  }

  const truncatedFields: TruncatedField[] = [];
  for (const field of metadata.truncatedFields) {
    if (
      (field !== 'title' && field !== 'body') ||
      truncatedFields.includes(field)
    ) {
      return invalidResponse('truncated fields metadata');
    }
    truncatedFields.push(field);
  }
  if (metadata.inputTruncated !== truncatedFields.length > 0) {
    return invalidResponse('truncation metadata');
  }

  return {
    latencyMs: metadata.latencyMs,
    inputTruncated: metadata.inputTruncated,
    truncatedFields,
  };
}

function normalizeChoice<T extends string>(
  answer: unknown,
  allowedValues: readonly T[],
  field: string,
): ChoiceDecision<T> {
  if (!isRecord(answer) || answer.type !== 'choice') {
    return invalidResponse(`${field} answer type`);
  }
  if (
    typeof answer.choice !== 'string' ||
    !allowedValues.some((value) => value === answer.choice)
  ) {
    return invalidResponse(`${field} selected choice`);
  }
  if (!isRecord(answer.probabilities)) {
    return invalidResponse(`${field} probabilities`);
  }

  const probabilities: Partial<Record<T, number>> = {};
  for (const value of allowedValues) {
    probabilities[value] = unitProbability(
      answer.probabilities[value],
      `${field}.probabilities.${value}`,
    );
  }

  const selectedValue = answer.choice as T;
  const selectedProbability = probabilities[selectedValue];
  if (selectedProbability === undefined) {
    return invalidResponse(`${field} selected probability`);
  }

  return {
    value: selectedValue,
    selectedProbability,
    confidence: unitProbability(answer.confidence, `${field}.confidence`),
    probabilities: probabilities as Record<T, number>,
  };
}

function normalizeNoul(answer: unknown, field: string): number {
  if (!isRecord(answer) || answer.type !== 'noul') {
    return invalidResponse(`${field} answer type`);
  }
  return unitProbability(answer.noul, `${field}.noul`);
}

export function normalizeJevResult(
  response: unknown,
  metadata: NormalizationMetadata,
): TriageResult {
  const validatedMetadata = normalizeMetadata(metadata);
  if (!isRecord(response)) return invalidResponse('response');
  if (typeof response.model !== 'string' || response.model.trim() === '') {
    return invalidResponse('model');
  }
  if (!isRecord(response.answers)) return invalidResponse('answers');
  if (!isRecord(response.usage)) return invalidResponse('usage');

  const usage = {
    inputTokens: nonnegativeInteger(
      response.usage.input_tokens,
      'usage.input_tokens',
    ),
    outputTokens: nonnegativeInteger(
      response.usage.output_tokens,
      'usage.output_tokens',
    ),
  };

  return {
    issueType: normalizeChoice<IssueType>(
      response.answers.issueType,
      ISSUE_TYPES,
      'issueType',
    ),
    engineeringArea: normalizeChoice<EngineeringArea>(
      response.answers.engineeringArea,
      ENGINEERING_AREAS,
      'engineeringArea',
    ),
    priority: normalizeChoice<IssuePriority>(
      response.answers.priority,
      PRIORITIES,
      'priority',
    ),
    securitySensitive: {
      probabilityYes: normalizeNoul(
        response.answers.securitySensitive,
        'securitySensitive',
      ),
    },
    needsHumanReview: {
      probabilityYes: normalizeNoul(
        response.answers.needsHumanReview,
        'needsHumanReview',
      ),
    },
    meta: {
      model: response.model,
      latencyMs: validatedMetadata.latencyMs,
      inputTruncated: validatedMetadata.inputTruncated,
      truncatedFields: [...validatedMetadata.truncatedFields],
      usage,
    },
  };
}
