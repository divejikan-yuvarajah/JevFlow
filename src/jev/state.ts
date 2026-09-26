import type { JsonValue } from '@typesafe-ai/sdk';

import { TriageError } from '../triage/triage.types.js';

export const MAX_TITLE_CODE_POINTS = 300;
export const MAX_BODY_CODE_POINTS = 8_000;

export type TruncatedField = 'title' | 'body';

export interface JevIssueState {
  readonly [key: string]: JsonValue;
  readonly source: 'github_issue';
  readonly title: string;
  readonly body: string;
  readonly inputTruncated: boolean;
  readonly truncatedFields: TruncatedField[];
}

export interface BuiltJevState {
  readonly state: JevIssueState;
  readonly inputTruncated: boolean;
  readonly truncatedFields: readonly TruncatedField[];
}

function invalidInput(message: string): never {
  throw new TriageError('invalid_input', message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function truncateCodePoints(
  value: string,
  maximum: number,
): { readonly value: string; readonly truncated: boolean } {
  const codePoints = Array.from(value);
  if (codePoints.length <= maximum) return { value, truncated: false };
  return { value: codePoints.slice(0, maximum).join(''), truncated: true };
}

function optionalString(
  record: Record<string, unknown>,
  key: 'issueUrl' | 'repository',
): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    return invalidInput(`${key} must be a nonempty string when provided.`);
  }
  return value.trim();
}

function validateIssueUrl(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (value.length > 2_048) return invalidInput('issueUrl is too long.');
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return invalidInput('issueUrl must use HTTP or HTTPS.');
    }
    if (url.username !== '' || url.password !== '') {
      return invalidInput('issueUrl must not contain credentials.');
    }
  } catch {
    return invalidInput('issueUrl must be a valid URL.');
  }
  return value;
}

function validateRepository(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
  const [owner, name] = value.split('/');
  if (
    value.length > 200 ||
    !repositoryPattern.test(value) ||
    owner === '.' ||
    owner === '..' ||
    name === '.' ||
    name === '..'
  ) {
    return invalidInput('repository must use the owner/name format.');
  }
  return value;
}

export function buildJevState(input: unknown): BuiltJevState {
  if (!isRecord(input)) {
    return invalidInput('Issue input must be an object.');
  }

  const record = input;
  if (typeof record.title !== 'string' || record.title.trim() === '') {
    return invalidInput('Issue title must be a nonempty string.');
  }

  const rawBody = record.body;
  if (
    rawBody !== undefined &&
    rawBody !== null &&
    typeof rawBody !== 'string'
  ) {
    return invalidInput('Issue body must be a string, null, or omitted.');
  }

  const title = truncateCodePoints(record.title.trim(), MAX_TITLE_CODE_POINTS);
  const body = truncateCodePoints(
    typeof rawBody === 'string' ? rawBody.trim() : '',
    MAX_BODY_CODE_POINTS,
  );
  const truncatedFields: TruncatedField[] = [];
  if (title.truncated) truncatedFields.push('title');
  if (body.truncated) truncatedFields.push('body');

  const issueNumber = record.issueNumber;
  if (
    issueNumber !== undefined &&
    (!Number.isSafeInteger(issueNumber) || Number(issueNumber) <= 0)
  ) {
    return invalidInput('issueNumber must be a positive safe integer.');
  }

  const issueUrl = validateIssueUrl(optionalString(record, 'issueUrl'));
  const repository = validateRepository(optionalString(record, 'repository'));
  const inputTruncated = truncatedFields.length > 0;
  const state: JevIssueState = {
    source: 'github_issue',
    title: title.value,
    body: body.value,
    inputTruncated,
    truncatedFields: [...truncatedFields],
    ...(issueNumber === undefined ? {} : { issueNumber: Number(issueNumber) }),
    ...(issueUrl === undefined ? {} : { issueUrl }),
    ...(repository === undefined ? {} : { repository }),
  };

  return { state, inputTruncated, truncatedFields };
}
