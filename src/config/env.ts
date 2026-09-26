import {
  DEFAULT_AUTO_THRESHOLD,
  DEFAULT_REVIEW_THRESHOLD,
} from '../policy/thresholds.js';

export type Environment = Readonly<Record<string, string | undefined>>;

export interface AppConfig {
  readonly autoThreshold: number;
  readonly reviewThreshold: number;
  readonly typesafeApiKey?: string;
  readonly githubToken?: string;
}

export class ConfigError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function optionalSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function parseThreshold(
  env: Environment,
  variableName: 'AUTO_THRESHOLD' | 'REVIEW_THRESHOLD',
  defaultValue: number,
): number {
  const trimmedValue = env[variableName]?.trim();
  if (!trimmedValue) return defaultValue;

  const parsedValue = Number(trimmedValue);
  if (!Number.isFinite(parsedValue) || parsedValue < 0 || parsedValue > 1) {
    throw new ConfigError(
      `${variableName} must be a finite number from 0 to 1.`,
    );
  }
  return parsedValue;
}

export function loadConfig(env: Environment = process.env): AppConfig {
  const autoThreshold = parseThreshold(
    env,
    'AUTO_THRESHOLD',
    DEFAULT_AUTO_THRESHOLD,
  );
  const reviewThreshold = parseThreshold(
    env,
    'REVIEW_THRESHOLD',
    DEFAULT_REVIEW_THRESHOLD,
  );

  if (reviewThreshold > autoThreshold) {
    throw new ConfigError(
      'REVIEW_THRESHOLD must be less than or equal to AUTO_THRESHOLD.',
    );
  }

  const typesafeApiKey = optionalSecret(env.TYPESAFE_API_KEY);
  const githubToken = optionalSecret(env.GITHUB_TOKEN);
  return {
    autoThreshold,
    reviewThreshold,
    ...(typesafeApiKey === undefined ? {} : { typesafeApiKey }),
    ...(githubToken === undefined ? {} : { githubToken }),
  };
}
