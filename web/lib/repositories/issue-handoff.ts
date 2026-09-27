import { parseRepositoryInput } from '../github/parse-repository-input';
import type { PublicIssueDetail } from '../github/repository-types';

const STORAGE_KEY = 'jevflow:public-issue-handoff';

export interface ImportedIssueHandoff {
  readonly version: 1;
  readonly repository: string;
  readonly number: number;
  readonly htmlUrl: string;
  readonly title: string;
  readonly body: string;
}

function bounded(value: string, maximum: number): string {
  return Array.from(value).slice(0, maximum).join('');
}

export function saveIssueHandoff(
  storage: Storage,
  repository: string,
  issue: PublicIssueDetail,
): void {
  const identity = parseRepositoryInput(repository);
  const expectedUrl = `${identity.url}/issues/${String(issue.number)}`;
  if (issue.htmlUrl !== expectedUrl)
    throw new Error('The issue source is invalid.');
  const handoff: ImportedIssueHandoff = {
    version: 1,
    repository: identity.fullName,
    number: issue.number,
    htmlUrl: expectedUrl,
    title: bounded(issue.title, 300),
    body: bounded(issue.body, 8_000),
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(handoff));
}

export function consumeIssueHandoff(
  storage: Storage,
): ImportedIssueHandoff | null {
  const raw = storage.getItem(STORAGE_KEY);
  storage.removeItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (typeof value !== 'object' || value === null) return null;
    const record = value as Record<string, unknown>;
    if (
      record.version !== 1 ||
      typeof record.repository !== 'string' ||
      !Number.isSafeInteger(record.number) ||
      Number(record.number) <= 0 ||
      typeof record.htmlUrl !== 'string' ||
      typeof record.title !== 'string' ||
      record.title.trim().length === 0 ||
      typeof record.body !== 'string'
    ) {
      return null;
    }
    const identity = parseRepositoryInput(record.repository);
    const expectedUrl = `${identity.url}/issues/${String(record.number)}`;
    if (record.htmlUrl !== expectedUrl) return null;
    return {
      version: 1,
      repository: identity.fullName,
      number: Number(record.number),
      htmlUrl: expectedUrl,
      title: bounded(record.title, 300),
      body: bounded(record.body, 8_000),
    };
  } catch {
    return null;
  }
}
