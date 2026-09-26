import { EvaluationError } from './evaluation.types.js';

export type EvaluationOutputFormat = 'markdown' | 'json';

export type EvaluationCliOptions =
  | { readonly help: true }
  | {
      readonly help: false;
      readonly mode: 'fixture' | 'live';
      readonly confirmLive: boolean;
      readonly format: EvaluationOutputFormat;
      readonly outputPath?: string;
      readonly datasetPath?: string;
      readonly fixturesPath?: string;
      readonly limit?: number;
    };

export const EVALUATION_USAGE = `Usage:
  npm run eval -- --help
  npm run eval -- --mode fixture [--format markdown|json] [--output <path>]
  npm run eval -- --mode live --confirm-live [--limit 1..30] [--format markdown|json] [--output <path>]

Options:
  --mode <fixture|live>    Default: fixture. Live mode may incur provider charges.
  --confirm-live           Required for live mode; never used by tests or CI.
  --limit <N>              Evaluate the first N ordered records.
  --dataset <path>         Override the versioned synthetic dataset.
  --fixtures <path>        Override fixtures in fixture mode only.
  --format <markdown|json> Default: markdown.
  --output <path>          Write inside the current workspace (.md or .json).`;

function nextValue(
  args: readonly string[],
  index: number,
  flag: string,
): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new EvaluationError('invalid_arguments', `${flag} requires a value.`);
  }
  return value;
}

export function parseEvaluationArgs(
  args: readonly string[],
): EvaluationCliOptions {
  if (args.includes('--help') || args.includes('-h')) {
    if (args.length !== 1) {
      throw new EvaluationError(
        'invalid_arguments',
        '--help cannot be combined with other flags.',
      );
    }
    return { help: true };
  }

  let mode: 'fixture' | 'live' = 'fixture';
  let modeSeen = false;
  let confirmLive = false;
  let format: EvaluationOutputFormat = 'markdown';
  let formatSeen = false;
  let outputPath: string | undefined;
  let datasetPath: string | undefined;
  let fixturesPath: string | undefined;
  let limit: number | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--confirm-live') {
      if (confirmLive) {
        throw new EvaluationError(
          'invalid_arguments',
          '--confirm-live may be provided only once.',
        );
      }
      confirmLive = true;
    } else if (argument === '--mode') {
      if (modeSeen) {
        throw new EvaluationError(
          'invalid_arguments',
          '--mode may be provided only once.',
        );
      }
      const value = nextValue(args, index, '--mode');
      if (value !== 'fixture' && value !== 'live') {
        throw new EvaluationError(
          'invalid_arguments',
          '--mode must be fixture or live.',
        );
      }
      mode = value;
      modeSeen = true;
      index += 1;
    } else if (argument === '--format') {
      if (formatSeen) {
        throw new EvaluationError(
          'invalid_arguments',
          '--format may be provided only once.',
        );
      }
      const value = nextValue(args, index, '--format');
      if (value !== 'markdown' && value !== 'json') {
        throw new EvaluationError(
          'invalid_arguments',
          '--format must be markdown or json.',
        );
      }
      format = value;
      formatSeen = true;
      index += 1;
    } else if (
      argument === '--output' ||
      argument === '--dataset' ||
      argument === '--fixtures'
    ) {
      const value = nextValue(args, index, argument);
      if (argument === '--output') {
        if (outputPath !== undefined) {
          throw new EvaluationError(
            'invalid_arguments',
            '--output may be provided only once.',
          );
        }
        outputPath = value;
      } else if (argument === '--dataset') {
        if (datasetPath !== undefined) {
          throw new EvaluationError(
            'invalid_arguments',
            '--dataset may be provided only once.',
          );
        }
        datasetPath = value;
      } else {
        if (fixturesPath !== undefined) {
          throw new EvaluationError(
            'invalid_arguments',
            '--fixtures may be provided only once.',
          );
        }
        fixturesPath = value;
      }
      index += 1;
    } else if (argument === '--limit') {
      if (limit !== undefined) {
        throw new EvaluationError(
          'invalid_arguments',
          '--limit may be provided only once.',
        );
      }
      const value = nextValue(args, index, '--limit');
      if (!/^[1-9][0-9]*$/u.test(value)) {
        throw new EvaluationError(
          'invalid_arguments',
          '--limit must be a positive integer.',
        );
      }
      limit = Number(value);
      if (!Number.isSafeInteger(limit)) {
        throw new EvaluationError(
          'invalid_arguments',
          '--limit must be a positive safe integer.',
        );
      }
      index += 1;
    } else {
      throw new EvaluationError(
        'invalid_arguments',
        `Unknown argument: ${argument ?? ''}`,
      );
    }
  }

  if (mode === 'fixture' && confirmLive) {
    throw new EvaluationError(
      'invalid_arguments',
      '--confirm-live is valid only with --mode live.',
    );
  }
  if (mode === 'live' && fixturesPath !== undefined) {
    throw new EvaluationError(
      'invalid_arguments',
      '--fixtures is valid only in fixture mode.',
    );
  }

  return {
    help: false,
    mode,
    confirmLive,
    format,
    ...(outputPath === undefined ? {} : { outputPath }),
    ...(datasetPath === undefined ? {} : { datasetPath }),
    ...(fixturesPath === undefined ? {} : { fixturesPath }),
    ...(limit === undefined ? {} : { limit }),
  };
}
