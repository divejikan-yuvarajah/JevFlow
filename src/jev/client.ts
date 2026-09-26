import { TypeSafeClient, type TypeSafeClientConfig } from '@typesafe-ai/sdk';

import type { Environment } from '../config/env.js';
import { TriageError } from '../triage/triage.types.js';
import type {
  JevProvider,
  JevSystemOneRequest,
  JevSystemOneResponse,
} from './types.js';

interface JevSdkClient {
  systemOne(request: JevSystemOneRequest): Promise<JevSystemOneResponse>;
}

export interface CreateJevProviderOptions {
  readonly env?: Environment;
  readonly clientFactory?: (config: TypeSafeClientConfig) => JevSdkClient;
}

function defaultClientFactory(config: TypeSafeClientConfig): JevSdkClient {
  return new TypeSafeClient(config);
}

export function createJevProvider(
  options: CreateJevProviderOptions = {},
): JevProvider {
  const env = options.env ?? process.env;
  const clientFactory = options.clientFactory ?? defaultClientFactory;

  return {
    async systemOne(
      request: JevSystemOneRequest,
    ): Promise<JevSystemOneResponse> {
      const apiKey = env.TYPESAFE_API_KEY?.trim();
      if (!apiKey) {
        throw new TriageError(
          'missing_api_key',
          'TYPESAFE_API_KEY is required for a live Jev request.',
        );
      }

      try {
        const client = clientFactory({
          apiKey,
          logLevel: 'off',
          timeout: 10_000,
          retry: { maxRetries: 2 },
        });
        return await client.systemOne(request);
      } catch (error: unknown) {
        if (error instanceof TriageError) throw error;
        throw new TriageError(
          'provider_unavailable',
          'The Jev provider request could not be completed.',
        );
      }
    },
  };
}
