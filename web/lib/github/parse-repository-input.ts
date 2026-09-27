import type { RepositoryIdentity } from './repository-types';

const MAX_REPOSITORY_INPUT_LENGTH = 240;
const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]{1,100}$/u;

export class RepositoryInputError extends Error {
  public constructor() {
    super(
      'Enter a public GitHub repository as https://github.com/owner/repo or owner/repo.',
    );
    this.name = 'RepositoryInputError';
  }
}

function fail(): never {
  throw new RepositoryInputError();
}

function validateSegments(owner: string, rawRepo: string): RepositoryIdentity {
  const repo = rawRepo.endsWith('.git') ? rawRepo.slice(0, -4) : rawRepo;
  if (
    !OWNER_PATTERN.test(owner) ||
    !REPOSITORY_PATTERN.test(repo) ||
    repo === '.' ||
    repo === '..' ||
    repo.endsWith('.') ||
    rawRepo.endsWith('.git.git')
  ) {
    return fail();
  }
  const fullName = `${owner}/${repo}`;
  return {
    owner,
    repo,
    fullName,
    url: `https://github.com/${owner}/${repo}`,
  };
}

export function parseRepositoryInput(input: unknown): RepositoryIdentity {
  if (typeof input !== 'string') return fail();
  const value = input.trim();
  if (
    value.length === 0 ||
    value.length > MAX_REPOSITORY_INPUT_LENGTH ||
    /[\u0000-\u001F\u007F\\]/u.test(value) ||
    /%2f|%5c/iu.test(value)
  ) {
    return fail();
  }

  if (!value.includes('://')) {
    const match = /^([^/]+)\/([^/]+)$/u.exec(value);
    if (match === null) return fail();
    return validateSegments(match[1]!, match[2]!);
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return fail();
  }
  const authority = value.slice(value.indexOf('://') + 3).split(/[/?#]/u)[0];
  if (
    url.protocol !== 'https:' ||
    url.hostname.toLowerCase() !== 'github.com' ||
    authority?.toLowerCase() !== 'github.com' ||
    url.port !== '' ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== ''
  ) {
    return fail();
  }
  const match = /^\/([^/]+)\/([^/]+)\/?$/u.exec(url.pathname);
  if (match === null) return fail();
  return validateSegments(match[1]!, match[2]!);
}
