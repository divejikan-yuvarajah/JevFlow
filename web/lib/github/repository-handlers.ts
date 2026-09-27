import {
  RepositoryInputError,
  parseRepositoryInput,
} from './parse-repository-input';
import {
  PublicGitHubError,
  type PublicGitHubReader,
} from './public-github-client';
import type {
  PublicGitHubErrorCode,
  PublicIssueFilter,
} from './repository-types';

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function errorResponse(error: unknown): Response {
  if (error instanceof RepositoryInputError) {
    return json(
      { ok: false, error: { code: 'invalid_request', message: error.message } },
      400,
    );
  }
  if (error instanceof PublicGitHubError) {
    const status =
      error.code === 'not_found'
        ? 404
        : error.code === 'rate_limited'
          ? 429
          : error.code === 'issues_disabled'
            ? 409
            : error.code === 'timeout'
              ? 504
              : 502;
    return json(
      {
        ok: false,
        error: {
          code: error.code satisfies PublicGitHubErrorCode,
          message: error.message,
          ...(error.retryAfterSeconds === undefined
            ? {}
            : { retryAfterSeconds: error.retryAfterSeconds }),
        },
      },
      status,
    );
  }
  return json(
    {
      ok: false,
      error: {
        code: 'unavailable',
        message: 'The public GitHub request failed safely.',
      },
    },
    502,
  );
}

function positiveInteger(
  value: string | null,
  fallback: number,
  maximum: number,
): number {
  if (value === null) return fallback;
  if (!/^[1-9][0-9]*$/u.test(value)) throw new RepositoryInputError();
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > maximum)
    throw new RepositoryInputError();
  return parsed;
}

function repositoryFrom(request: Request) {
  return parseRepositoryInput(
    new URL(request.url).searchParams.get('repository'),
  );
}

export async function handleResolveRepository(
  request: Request,
  reader: PublicGitHubReader,
): Promise<Response> {
  if (request.method !== 'GET')
    return json(
      {
        ok: false,
        error: {
          code: 'invalid_request',
          message: 'Use GET for public repository reads.',
        },
      },
      405,
    );
  try {
    const data = await reader.getRepository(repositoryFrom(request));
    return json({ ok: true, data, source: 'github-public-api' }, 200);
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function handleListIssues(
  request: Request,
  reader: PublicGitHubReader,
): Promise<Response> {
  if (request.method !== 'GET')
    return json(
      {
        ok: false,
        error: {
          code: 'invalid_request',
          message: 'Use GET for public issue reads.',
        },
      },
      405,
    );
  try {
    const url = new URL(request.url);
    const repository = repositoryFrom(request);
    const state = url.searchParams.get('state') ?? 'open';
    if (state !== 'open' && state !== 'closed' && state !== 'all')
      throw new RepositoryInputError();
    const page = positiveInteger(url.searchParams.get('page'), 1, 10);
    const perPage = positiveInteger(url.searchParams.get('perPage'), 20, 30);
    const metadata = await reader.getRepository(repository);
    if (!metadata.hasIssues) {
      throw new PublicGitHubError(
        'issues_disabled',
        'GitHub Issues are disabled for this repository.',
      );
    }
    const result = await reader.listIssues({
      repository: metadata,
      state: state as PublicIssueFilter,
      page,
      perPage,
    });
    return json(
      {
        ok: true,
        data: {
          repository: metadata,
          issues: result.items,
          page,
          perPage,
          hasNextPage: result.hasNextPage,
          source: 'github-public-api',
        },
        source: 'github-public-api',
      },
      200,
    );
  } catch (error: unknown) {
    return errorResponse(error);
  }
}

export async function handleGetIssue(
  request: Request,
  reader: PublicGitHubReader,
): Promise<Response> {
  if (request.method !== 'GET')
    return json(
      {
        ok: false,
        error: {
          code: 'invalid_request',
          message: 'Use GET for public issue reads.',
        },
      },
      405,
    );
  try {
    const url = new URL(request.url);
    const repository = repositoryFrom(request);
    const issueNumber = positiveInteger(
      url.searchParams.get('number'),
      0,
      Number.MAX_SAFE_INTEGER,
    );
    if (issueNumber === 0) throw new RepositoryInputError();
    const metadata = await reader.getRepository(repository);
    if (!metadata.hasIssues)
      throw new PublicGitHubError(
        'issues_disabled',
        'GitHub Issues are disabled for this repository.',
      );
    const data = await reader.getIssue(metadata, issueNumber);
    return json(
      {
        ok: true,
        data: { repository: metadata, issue: data },
        source: 'github-public-api',
      },
      200,
    );
  } catch (error: unknown) {
    return errorResponse(error);
  }
}
