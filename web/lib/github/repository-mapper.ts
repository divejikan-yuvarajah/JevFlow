import { parseRepositoryInput } from './parse-repository-input';
import type {
  PublicIssueDetail,
  PublicIssueLabel,
  PublicIssueState,
  PublicIssueSummary,
  PublicRepository,
} from './repository-types';

const MAX_DESCRIPTION = 500;
const MAX_BODY = 8_000;
const MAX_PREVIEW = 280;

export class GitHubMappingError extends Error {
  public constructor() {
    super('GitHub returned an unexpected public response.');
    this.name = 'GitHubMappingError';
  }
}

function fail(): never {
  throw new GitHubMappingError();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function bounded(value: string, maximum: number): string {
  return Array.from(value).slice(0, maximum).join('');
}

function isoDate(value: unknown): string {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) {
    return fail();
  }
  return new Date(value).toISOString();
}

function githubIssueUrl(
  value: unknown,
  fullName: string,
  number: number,
): string {
  const expected = `https://github.com/${fullName}/issues/${String(number)}`;
  if (value !== expected) return fail();
  return expected;
}

function labels(value: unknown): readonly PublicIssueLabel[] {
  if (!Array.isArray(value)) return fail();
  return value.slice(0, 20).map((entry) => {
    if (typeof entry === 'string') return { name: bounded(entry, 100) };
    if (!isRecord(entry) || typeof entry.name !== 'string') return fail();
    const name = bounded(entry.name, 100);
    if (name.length === 0) return fail();
    const color =
      typeof entry.color === 'string' && /^[0-9A-Fa-f]{6}$/u.test(entry.color)
        ? entry.color.toLowerCase()
        : undefined;
    return { name, ...(color === undefined ? {} : { color }) };
  });
}

function issueBase(value: unknown, fullName: string): PublicIssueDetail | null {
  if (!isRecord(value) || value.pull_request !== undefined) return null;
  const number = value.number;
  if (!Number.isSafeInteger(number) || Number(number) <= 0) return fail();
  if (
    typeof value.title !== 'string' ||
    value.title.trim().length === 0 ||
    (value.state !== 'open' && value.state !== 'closed')
  ) {
    return fail();
  }
  const body = value.body === null ? '' : value.body;
  if (typeof body !== 'string') return fail();
  const authorLogin =
    isRecord(value.user) && typeof value.user.login === 'string'
      ? bounded(value.user.login, 100)
      : undefined;
  const boundedBody = bounded(body, MAX_BODY);
  return {
    number: Number(number),
    title: bounded(value.title.trim(), 300),
    state: value.state as PublicIssueState,
    htmlUrl: githubIssueUrl(value.html_url, fullName, Number(number)),
    createdAt: isoDate(value.created_at),
    updatedAt: isoDate(value.updated_at),
    labels: labels(value.labels),
    ...(authorLogin === undefined ? {} : { authorLogin }),
    bodyPreview: bounded(boundedBody.replace(/\s+/gu, ' ').trim(), MAX_PREVIEW),
    body: boundedBody,
  };
}

export function mapPublicRepository(
  value: unknown,
  fetchedAt: Date,
): PublicRepository {
  if (
    !isRecord(value) ||
    value.private !== false ||
    typeof value.full_name !== 'string' ||
    typeof value.name !== 'string' ||
    !isRecord(value.owner) ||
    typeof value.owner.login !== 'string' ||
    typeof value.default_branch !== 'string' ||
    value.default_branch.length === 0 ||
    typeof value.has_issues !== 'boolean' ||
    typeof value.archived !== 'boolean' ||
    !Number.isSafeInteger(value.open_issues_count) ||
    Number(value.open_issues_count) < 0
  ) {
    return fail();
  }
  const identity = parseRepositoryInput(value.full_name);
  if (
    identity.owner !== value.owner.login ||
    identity.repo !== value.name ||
    value.html_url !== identity.url ||
    (value.description !== null && typeof value.description !== 'string')
  ) {
    return fail();
  }
  return {
    ...identity,
    htmlUrl: identity.url,
    description:
      typeof value.description === 'string'
        ? bounded(value.description, MAX_DESCRIPTION)
        : null,
    defaultBranch: bounded(value.default_branch, 255),
    openIssueAndPullRequestCount: Number(value.open_issues_count),
    hasIssues: value.has_issues,
    archived: value.archived,
    visibility: 'public',
    fetchedAt: fetchedAt.toISOString(),
  };
}

export function mapIssueList(
  value: unknown,
  fullName: string,
): readonly PublicIssueSummary[] {
  if (!Array.isArray(value)) return fail();
  return value.flatMap((entry) => {
    const mapped = issueBase(entry, fullName);
    if (mapped === null) return [];
    return [
      {
        number: mapped.number,
        title: mapped.title,
        state: mapped.state,
        htmlUrl: mapped.htmlUrl,
        createdAt: mapped.createdAt,
        updatedAt: mapped.updatedAt,
        labels: mapped.labels,
        authorLogin: mapped.authorLogin,
        bodyPreview: mapped.bodyPreview,
      },
    ];
  });
}

export function mapIssueDetail(
  value: unknown,
  fullName: string,
): PublicIssueDetail {
  const mapped = issueBase(value, fullName);
  if (mapped === null) return fail();
  return mapped;
}
