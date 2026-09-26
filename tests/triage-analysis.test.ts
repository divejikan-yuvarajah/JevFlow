import { describe, expect, it, vi } from 'vitest';

import { createJevProvider } from '../src/jev/client.js';
import { JEV_QUESTIONS } from '../src/jev/questions.js';
import type { JevProvider } from '../src/jev/types.js';
import { analyzeIssue } from '../src/triage/analyzeIssue.js';
import { TriageError } from '../src/triage/triage.types.js';
import { VALID_JEV_RESPONSE } from './fixtures/jev-response.js';

describe('analyzeIssue', () => {
  it('invokes the provider once with bounded state and all questions', async () => {
    const systemOne = vi
      .fn<JevProvider['systemOne']>()
      .mockResolvedValue(VALID_JEV_RESPONSE);
    const now = vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(112.5);

    const result = await analyzeIssue(
      {
        title: '  Broken export  ',
        body: 'No file downloads.',
        repository: 'example/repo',
      },
      { provider: { systemOne }, now },
    );

    expect(systemOne).toHaveBeenCalledTimes(1);
    expect(systemOne).toHaveBeenCalledWith({
      state: {
        source: 'github_issue',
        title: 'Broken export',
        body: 'No file downloads.',
        repository: 'example/repo',
        inputTruncated: false,
        truncatedFields: [],
      },
      questions: JEV_QUESTIONS,
    });
    expect(result.meta.latencyMs).toBe(12.5);
    expect(result.issueType.value).toBe('bug');
  });

  it('does not invoke the provider for invalid input', async () => {
    const systemOne = vi
      .fn<JevProvider['systemOne']>()
      .mockResolvedValue(VALID_JEV_RESPONSE);

    await expect(
      analyzeIssue(
        { title: '   ', body: 'sensitive issue body' },
        { provider: { systemOne } },
      ),
    ).rejects.toMatchObject({ code: 'invalid_input' });
    expect(systemOne).not.toHaveBeenCalled();
  });

  it('sanitizes provider failures without returning classifications', async () => {
    const secret = 'fake-secret-value';
    const sensitiveBody = 'private customer issue details';
    const provider: JevProvider = {
      systemOne: () => Promise.reject(new Error(`${secret}: ${sensitiveBody}`)),
    };

    expect.assertions(3);
    try {
      await analyzeIssue(
        { title: 'Provider failure', body: sensitiveBody },
        { provider },
      );
    } catch (error: unknown) {
      expect(error).toMatchObject({ code: 'provider_unavailable' });
      expect(String(error)).not.toContain(secret);
      expect(String(error)).not.toContain(sensitiveBody);
    }
  });
});

describe('createJevProvider', () => {
  it('requires an API key only when a real provider invocation is attempted', async () => {
    const clientFactory = vi.fn((): never => {
      throw new Error('Client construction must stay lazy without a key.');
    });
    const provider = createJevProvider({ env: {}, clientFactory });

    await expect(
      provider.systemOne({ state: 'safe test', questions: JEV_QUESTIONS }),
    ).rejects.toMatchObject({ code: 'missing_api_key' });
    expect(clientFactory).not.toHaveBeenCalled();
  });

  it('constructs a quiet client lazily and makes one SDK call', async () => {
    const sdkSystemOne = vi
      .fn<JevProvider['systemOne']>()
      .mockResolvedValue(VALID_JEV_RESPONSE);
    const clientFactory = vi.fn(() => ({
      systemOne: sdkSystemOne,
    }));
    const provider = createJevProvider({
      env: { TYPESAFE_API_KEY: 'fake-test-key' },
      clientFactory,
    });
    const request = { state: 'safe test', questions: JEV_QUESTIONS };

    await expect(provider.systemOne(request)).resolves.toBe(VALID_JEV_RESPONSE);
    expect(clientFactory).toHaveBeenCalledTimes(1);
    expect(clientFactory).toHaveBeenCalledWith({
      apiKey: 'fake-test-key',
      logLevel: 'off',
      timeout: 10_000,
      retry: { maxRetries: 2 },
    });
    expect(sdkSystemOne).toHaveBeenCalledTimes(1);
    expect(sdkSystemOne).toHaveBeenCalledWith(request);
  });

  it('redacts SDK construction and request errors', async () => {
    const secret = 'fake-test-key';
    const provider = createJevProvider({
      env: { TYPESAFE_API_KEY: secret },
      clientFactory: () => {
        throw new Error(`Rejected ${secret}`);
      },
    });

    expect.assertions(2);
    try {
      await provider.systemOne({
        state: 'safe test',
        questions: JEV_QUESTIONS,
      });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(TriageError);
      expect(String(error)).not.toContain(secret);
    }
  });
});
