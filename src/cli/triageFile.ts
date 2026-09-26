import { readFile, stat } from 'node:fs/promises';

import type { IssueInput } from '../domain/issue.js';
import { buildJevState } from '../jev/state.js';
import { TriageError } from '../triage/triage.types.js';
import { CliError } from './triage.types.js';

export const MAX_ISSUE_FILE_BYTES = 64 * 1_024;

function assertAllowedFileSize(size: number): void {
  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_ISSUE_FILE_BYTES) {
    throw new CliError(
      'input',
      `The issue file must not exceed ${String(MAX_ISSUE_FILE_BYTES)} bytes.`,
    );
  }
}

export interface IssueFileAccess {
  getSize(path: string): Promise<number>;
  readText(path: string): Promise<string>;
}

const NODE_FILE_ACCESS: IssueFileAccess = {
  async getSize(path: string): Promise<number> {
    return (await stat(path)).size;
  },
  readText(path: string): Promise<string> {
    return readFile(path, 'utf8');
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function loadIssueFile(
  filePath: string,
  access: IssueFileAccess = NODE_FILE_ACCESS,
): Promise<IssueInput> {
  let size: number;
  try {
    size = await access.getSize(filePath);
  } catch {
    throw new CliError('input', 'The issue file could not be read.');
  }
  assertAllowedFileSize(size);

  let contents: string;
  try {
    contents = await access.readText(filePath);
  } catch {
    throw new CliError('input', 'The issue file could not be read.');
  }
  // Recheck the bytes actually read so a file changed after stat cannot bypass
  // the limit. This check still occurs before JSON parsing.
  assertAllowedFileSize(Buffer.byteLength(contents, 'utf8'));

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new CliError('input', 'The issue file must contain valid JSON.');
  }
  if (!isRecord(parsed)) {
    throw new CliError(
      'input',
      'The issue file must contain one issue object.',
    );
  }

  try {
    buildJevState(parsed);
  } catch (error: unknown) {
    if (error instanceof TriageError) {
      throw new CliError('input', error.message);
    }
    throw new CliError('input', 'The issue input is invalid.');
  }

  if (typeof parsed.title !== 'string') {
    throw new CliError('input', 'Issue title must be a nonempty string.');
  }
  return {
    title: parsed.title,
    body: typeof parsed.body === 'string' ? parsed.body : '',
    ...(typeof parsed.issueNumber === 'number'
      ? { issueNumber: parsed.issueNumber }
      : {}),
    ...(typeof parsed.issueUrl === 'string'
      ? { issueUrl: parsed.issueUrl.trim() }
      : {}),
    ...(typeof parsed.repository === 'string'
      ? { repository: parsed.repository.trim() }
      : {}),
  };
}
