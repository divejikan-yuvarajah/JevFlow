import { describe, expect, it, vi } from 'vitest';
import { handleAnalyzeRequest } from '@/lib/analyze-handler';
import { TriageError } from '../../dist/triage/triage.types.js';
import { makeLiveView } from './fixtures';

const enabledEnv = {
  NODE_ENV: 'development',
  JEVFLOW_LIVE_DEMO_ENABLED: 'true',
  TYPESAFE_API_KEY: 'test-placeholder',
};

function request(
  body: string,
  options: { readonly method?: string; readonly contentType?: string } = {},
): Request {
  return new Request('http://localhost/api/analyze', {
    method: options.method ?? 'POST',
    headers: {
      'Content-Type': options.contentType ?? 'application/json',
    },
    body: options.method === 'GET' ? undefined : body,
  });
}

async function responseBody(response: Response): Promise<unknown> {
  return response.json() as Promise<unknown>;
}

describe('analyze request boundary', () => {
  it('rejects non-POST requests before the analyzer', async () => {
    const analyze = vi.fn();
    const response = await handleAnalyzeRequest(
      request('', { method: 'GET' }),
      { analyze, env: enabledEnv },
    );
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('POST');
    expect(analyze).not.toHaveBeenCalled();
  });

  it('is disabled by default and always disabled in production', async () => {
    const analyze = vi.fn();
    const disabled = await handleAnalyzeRequest(
      request(JSON.stringify({ title: 'Synthetic' })),
      { analyze, env: { NODE_ENV: 'development' } },
    );
    const production = await handleAnalyzeRequest(
      request(JSON.stringify({ title: 'Synthetic' })),
      {
        analyze,
        env: { ...enabledEnv, NODE_ENV: 'production' },
      },
    );
    expect(disabled.status).toBe(503);
    expect(production.status).toBe(503);
    expect(analyze).not.toHaveBeenCalled();
  });

  it('rejects a missing server key even with explicit opt-in', async () => {
    const analyze = vi.fn();
    const response = await handleAnalyzeRequest(
      request(JSON.stringify({ title: 'Synthetic' })),
      {
        analyze,
        env: {
          NODE_ENV: 'development',
          JEVFLOW_LIVE_DEMO_ENABLED: 'true',
        },
      },
    );
    expect(response.status).toBe(503);
    expect(await responseBody(response)).toMatchObject({
      error: { code: 'live_missing_key' },
    });
    expect(analyze).not.toHaveBeenCalled();
  });

  it('rejects wrong content type, oversized body, and malformed JSON', async () => {
    const analyze = vi.fn();
    const wrongType = await handleAnalyzeRequest(
      request('{}', { contentType: 'text/plain' }),
      { analyze, env: enabledEnv },
    );
    const oversizedRequest = request('{}');
    oversizedRequest.headers.set('content-length', String(49 * 1024));
    const oversized = await handleAnalyzeRequest(oversizedRequest, {
      analyze,
      env: enabledEnv,
    });
    const malformed = await handleAnalyzeRequest(request('{'), {
      analyze,
      env: enabledEnv,
    });
    expect(wrongType.status).toBe(415);
    expect(oversized.status).toBe(413);
    expect(malformed.status).toBe(400);
    expect(analyze).not.toHaveBeenCalled();
  });

  it.each([
    ['missing title', { body: 'No title' }],
    ['unsupported title type', { title: 7 }],
    ['unsupported body type', { title: 'Synthetic', body: true }],
    ['unexpected field', { title: 'Synthetic', token: 'never-accept' }],
  ])('rejects %s before provider work', async (_name, payload) => {
    const analyze = vi.fn();
    const response = await handleAnalyzeRequest(
      request(JSON.stringify(payload)),
      { analyze, env: enabledEnv },
    );
    expect(response.status).toBe(400);
    expect(analyze).not.toHaveBeenCalled();
  });

  it('calls the injected core adapter exactly once for an accepted request', async () => {
    const analyze = vi.fn().mockResolvedValue(makeLiveView());
    const response = await handleAnalyzeRequest(
      request(
        JSON.stringify({
          title: 'Synthetic issue',
          body: 'Safe demonstration details.',
        }),
      ),
      { analyze, env: enabledEnv },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(analyze).toHaveBeenCalledWith({
      title: 'Synthetic issue',
      body: 'Safe demonstration details.',
    });
    const text = await response.text();
    expect(text).not.toContain('test-placeholder');
    expect(text).not.toContain('Safe demonstration details');
    expect(JSON.parse(text)).toMatchObject({
      ok: true,
      result: { source: 'live_jev' },
    });
  });

  it('sanitizes provider failures without fixture fallback or raw errors', async () => {
    const analyze = vi
      .fn()
      .mockRejectedValue(
        new TriageError('provider_unavailable', 'raw-secret-provider-error'),
      );
    const response = await handleAnalyzeRequest(
      request(JSON.stringify({ title: 'Synthetic issue' })),
      { analyze, env: enabledEnv },
    );
    const text = await response.text();
    expect(response.status).toBe(502);
    expect(text).toContain('provider_failure');
    expect(text).not.toContain('raw-secret-provider-error');
    expect(text).not.toContain('synthetic_fixture');
  });
});
