import {
  RepositoryInputError,
  parseRepositoryInput,
} from '../github/parse-repository-input';

const STORAGE_KEY = 'jevflow:linked-public-repositories';
export const MAX_LINKED_REPOSITORIES = 5;

interface StoredRepositories {
  readonly version: 1;
  readonly repositories: readonly { readonly fullName: string }[];
}

function normalize(values: readonly string[]): readonly string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    try {
      const fullName = parseRepositoryInput(value).fullName;
      const key = fullName.toLowerCase();
      if (!seen.has(key) && result.length < MAX_LINKED_REPOSITORIES) {
        seen.add(key);
        result.push(fullName);
      }
    } catch (error: unknown) {
      if (!(error instanceof RepositoryInputError)) throw error;
    }
  }
  return result;
}

export function loadLinkedRepositories(storage: Storage): readonly string[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('version' in parsed) ||
      parsed.version !== 1 ||
      !('repositories' in parsed) ||
      !Array.isArray(parsed.repositories)
    ) {
      return [];
    }
    return normalize(
      parsed.repositories.flatMap((entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        'fullName' in entry &&
        typeof entry.fullName === 'string'
          ? [entry.fullName]
          : [],
      ),
    );
  } catch {
    return [];
  }
}

function write(storage: Storage, values: readonly string[]): void {
  const payload: StoredRepositories = {
    version: 1,
    repositories: normalize(values).map((fullName) => ({ fullName })),
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function linkRepository(
  storage: Storage,
  fullName: string,
): readonly string[] {
  const current = loadLinkedRepositories(storage);
  const identity = parseRepositoryInput(fullName);
  if (
    current.some(
      (value) => value.toLowerCase() === identity.fullName.toLowerCase(),
    )
  ) {
    return current;
  }
  if (current.length >= MAX_LINKED_REPOSITORIES) {
    throw new Error(
      `Link up to ${String(MAX_LINKED_REPOSITORIES)} public repositories in this browser.`,
    );
  }
  const next = [...current, identity.fullName];
  write(storage, next);
  return next;
}

export function disconnectRepository(
  storage: Storage,
  fullName: string,
): readonly string[] {
  const next = loadLinkedRepositories(storage).filter(
    (value) => value.toLowerCase() !== fullName.toLowerCase(),
  );
  write(storage, next);
  return next;
}
