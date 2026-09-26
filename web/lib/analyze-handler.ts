import { buildJevState } from '../../dist/jev/state.js';
import { TriageError } from '../../dist/triage/triage.types.js';
import type { PublicTriageView } from './contracts';
import {
  getLiveDemoAvailability,
  type LiveDemoAvailability,
} from './demo-guards';

const MAX_REQUEST_BYTES = 48 * 1024;

type HandlerEnvironment = Readonly<Record<string, string | undefined>>;

export interface AnalyzeHandlerDependencies {
  readonly analyze: (issue: {
    readonly title: string;
    readonly body: string;
  }) => Promise<PublicTriageView>;
  readonly env?: HandlerEnvironment;
}

function jsonResponse(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return jsonResponse({ ok: false, error: { code, message } }, status);
}

function availabilityError(availability: LiveDemoAvailability): Response {
  const code =
    availability.status === 'missing-key'
      ? 'live_missing_key'
      : availability.status === 'production'
        ? 'live_production_disabled'
        : 'live_disabled';
  return errorResponse(503, code, availability.message);
}

function contentTypeIsJson(request: Request): boolean {
  const contentType = request.headers.get('content-type') ?? '';
  return /^application\/json(?:\s*;|$)/iu.test(contentType);
}

function contentLengthTooLarge(request: Request): boolean {
  const header = request.headers.get('content-length');
  if (header === null) return false;
  const value = Number(header);
  return Number.isFinite(value) && value > MAX_REQUEST_BYTES;
}

function hasOnlyIssueFields(value: Record<string, unknown>): boolean {
  return Object.keys(value).every((key) => key === 'title' || key === 'body');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function handleAnalyzeRequest(
  request: Request,
  dependencies: AnalyzeHandlerDependencies,
): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        ok: false,
        error: {
          code: 'method_not_allowed',
          message: 'Use POST to request an analysis.',
        },
      }),
      {
        status: 405,
        headers: {
          Allow: 'POST',
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json',
        },
      },
    );
  }

  const availability = getLiveDemoAvailability(dependencies.env ?? process.env);
  if (!availability.liveEnabled) return availabilityError(availability);
  if (!contentTypeIsJson(request)) {
    return errorResponse(
      415,
      'unsupported_content_type',
      'Content-Type must be application/json.',
    );
  }
  if (contentLengthTooLarge(request)) {
    return errorResponse(
      413,
      'payload_too_large',
      'Request body is too large.',
    );
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return errorResponse(400, 'invalid_request', 'Request body is unreadable.');
  }
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    return errorResponse(
      413,
      'payload_too_large',
      'Request body is too large.',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return errorResponse(
      400,
      'invalid_json',
      'Request body is not valid JSON.',
    );
  }
  if (!isRecord(parsed) || !hasOnlyIssueFields(parsed)) {
    return errorResponse(
      400,
      'invalid_request',
      'Request must contain only title and body.',
    );
  }

  try {
    buildJevState(parsed);
  } catch (error: unknown) {
    if (error instanceof TriageError && error.code === 'invalid_input') {
      return errorResponse(400, 'invalid_request', error.message);
    }
    return errorResponse(400, 'invalid_request', 'Issue input is invalid.');
  }

  const title = parsed.title;
  const body = parsed.body;
  if (typeof title !== 'string') {
    return errorResponse(400, 'invalid_request', 'Issue title is required.');
  }

  try {
    const result = await dependencies.analyze({
      title,
      body: typeof body === 'string' ? body : '',
    });
    return jsonResponse({ ok: true, result }, 200);
  } catch (error: unknown) {
    if (error instanceof TriageError) {
      if (error.code === 'missing_api_key') {
        return errorResponse(
          503,
          'live_missing_key',
          'The server credential is unavailable.',
        );
      }
      if (
        error.code === 'provider_unavailable' ||
        error.code === 'invalid_response'
      ) {
        return errorResponse(
          502,
          'provider_failure',
          'Jev could not complete this analysis. Try again deliberately.',
        );
      }
    }
    return errorResponse(
      500,
      'analysis_failed',
      'The analysis could not be completed safely.',
    );
  }
}
