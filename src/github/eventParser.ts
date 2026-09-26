import { open, stat } from 'node:fs/promises';

import type { IssueInput } from '../domain/issue.js';
import {
  GitHubAutomationError,
  type IssueTarget,
  type ParsedGitHubEvent,
  type RepositoryIdentity,
  type ValidatedGitHubIssue,
} from './github.types.js';

export const MAX_GITHUB_EVENT_BYTES = 1024 * 1024;

export interface EventFileAccess {
  getSize(path: string): Promise<number>;
  readText(path: string): Promise<string>;
}

const NODE_EVENT_FILE_ACCESS: EventFileAccess = {
  async getSize(path: string): Promise<number> {
    return (await stat(path)).size;
  },
  async readText(path: string): Promise<string> {
    const handle = await open(path, 'r');
    const buffer = Buffer.alloc(MAX_GITHUB_EVENT_BYTES + 1);
    let total = 0;
    try {
      while (total < buffer.length) {
        const { bytesRead } = await handle.read(
          buffer,
          total,
          buffer.length - total,
          null,
        );
        if (bytesRead === 0) break;
        total += bytesRead;
      }
      return buffer.subarray(0, total).toString('utf8');
    } finally {
      await handle.close();
    }
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalidEvent(message: string): never {
  throw new GitHubAutomationError('invalid_event', message);
}

function assertEventSize(size: number): void {
  if (
    !Number.isSafeInteger(size) ||
    size < 0 ||
    size > MAX_GITHUB_EVENT_BYTES
  ) {
    throw new GitHubAutomationError(
      'event_too_large',
      'The GitHub event payload exceeds the allowed size.',
    );
  }
}

export function parseRepositoryIdentity(value: unknown): RepositoryIdentity {
  if (typeof value !== 'string' || value.length > 140) {
    throw new GitHubAutomationError(
      'invalid_environment',
      'GITHUB_REPOSITORY must use the owner/repository format.',
    );
  }
  const match =
    /^(?<owner>[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/(?<repo>[A-Za-z0-9_.-]{1,100})$/u.exec(
      value,
    );
  const owner = match?.groups?.owner;
  const repo = match?.groups?.repo;
  if (
    owner === undefined ||
    repo === undefined ||
    repo === '.' ||
    repo === '..' ||
    repo.endsWith('.')
  ) {
    throw new GitHubAutomationError(
      'invalid_environment',
      'GITHUB_REPOSITORY must use the owner/repository format.',
    );
  }
  return { owner, repo, fullName: `${owner}/${repo}` };
}

export function parseDispatchIssueNumber(value: unknown): number {
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/u.test(value)) {
    return invalidEvent(
      'workflow_dispatch issue_number must be a positive safe integer.',
    );
  }
  const issueNumber = Number(value);
  if (!Number.isSafeInteger(issueNumber)) {
    return invalidEvent(
      'workflow_dispatch issue_number must be a positive safe integer.',
    );
  }
  return issueNumber;
}

function parseIssueNumber(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    return invalidEvent('The event issue number is invalid.');
  }
  return Number(value);
}

function validatePayloadRepository(
  payload: Record<string, unknown>,
  expected: RepositoryIdentity,
): void {
  const repository = payload.repository;
  if (!isRecord(repository) || repository.full_name !== expected.fullName) {
    return invalidEvent(
      'The event repository does not match GITHUB_REPOSITORY.',
    );
  }
}

function parseOpenedIssue(
  payload: Record<string, unknown>,
  repository: RepositoryIdentity,
): ValidatedGitHubIssue {
  validatePayloadRepository(payload, repository);
  const rawIssue = payload.issue;
  if (!isRecord(rawIssue) || rawIssue.pull_request !== undefined) {
    return invalidEvent('The opened event must contain a GitHub issue.');
  }
  const issueNumber = parseIssueNumber(rawIssue.number);
  if (typeof rawIssue.title !== 'string' || rawIssue.title.trim() === '') {
    return invalidEvent('The event issue title is invalid.');
  }
  if (
    rawIssue.body !== undefined &&
    rawIssue.body !== null &&
    typeof rawIssue.body !== 'string'
  ) {
    return invalidEvent('The event issue body is invalid.');
  }

  const target: IssueTarget = { repository, issueNumber };
  const input: IssueInput = {
    title: rawIssue.title,
    body: typeof rawIssue.body === 'string' ? rawIssue.body : '',
    issueNumber,
    issueUrl: `https://github.com/${repository.fullName}/issues/${String(issueNumber)}`,
    repository: repository.fullName,
  };
  return { target, input };
}

export function parseGitHubEvent(
  eventName: unknown,
  repositoryName: unknown,
  payload: unknown,
): ParsedGitHubEvent {
  const repository = parseRepositoryIdentity(repositoryName);
  if (typeof eventName !== 'string' || eventName === '') {
    throw new GitHubAutomationError(
      'invalid_environment',
      'GITHUB_EVENT_NAME is required.',
    );
  }
  if (!isRecord(payload)) return invalidEvent('The GitHub event must be JSON.');

  if (eventName === 'issues') {
    if (payload.action !== 'opened') {
      return { kind: 'skipped', repository, reason: 'unsupported_action' };
    }
    return {
      kind: 'issue-opened',
      issue: parseOpenedIssue(payload, repository),
    };
  }

  if (eventName === 'workflow_dispatch') {
    validatePayloadRepository(payload, repository);
    if (!isRecord(payload.inputs)) {
      return invalidEvent('workflow_dispatch inputs are missing.');
    }
    return {
      kind: 'workflow-dispatch',
      target: {
        repository,
        issueNumber: parseDispatchIssueNumber(payload.inputs.issue_number),
      },
    };
  }

  return { kind: 'skipped', repository, reason: 'unsupported_event' };
}

export async function readGitHubEventFile(
  path: string,
  access: EventFileAccess = NODE_EVENT_FILE_ACCESS,
): Promise<unknown> {
  let size: number;
  try {
    size = await access.getSize(path);
  } catch {
    throw new GitHubAutomationError(
      'invalid_event',
      'The GitHub event payload could not be read.',
    );
  }
  assertEventSize(size);

  let text: string;
  try {
    text = await access.readText(path);
  } catch {
    throw new GitHubAutomationError(
      'invalid_event',
      'The GitHub event payload could not be read.',
    );
  }
  assertEventSize(Buffer.byteLength(text, 'utf8'));
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return invalidEvent('The GitHub event payload is not valid JSON.');
  }
}
