import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';

import { config as loadDotenv } from 'dotenv';

import { ConfigError, loadConfig, type Environment } from '../config/env.js';
import {
  EVALUATION_USAGE,
  parseEvaluationArgs,
  type EvaluationOutputFormat,
} from '../evaluation/evalArgs.js';
import {
  EvaluationError,
  type EvaluationAnalyzer,
  type FixtureDataset,
} from '../evaluation/evaluation.types.js';
import { createFixtureAnalyzer } from '../evaluation/fixtureProvider.js';
import {
  loadEvaluationDataset,
  loadFixtureDataset,
} from '../evaluation/loadDataset.js';
import {
  renderEvaluationJson,
  renderEvaluationMarkdown,
} from '../evaluation/report.js';
import { runEvaluation } from '../evaluation/runEvaluation.js';
import { analyzeIssue } from '../triage/analyzeIssue.js';

const DEFAULT_DATASET_PATH = 'evals/dataset/github-issues.json';
const DEFAULT_FIXTURES_PATH = 'evals/fixtures/normalized-decisions.json';

export interface EvaluationCliDependencies {
  readonly env?: Environment;
  readonly loadEnvironment?: () => Promise<void>;
  readonly cwd?: string;
  readonly liveAnalyzer?: EvaluationAnalyzer;
  readonly fixtureAnalyzerFactory?: (
    fixtures: FixtureDataset,
  ) => EvaluationAnalyzer;
  readonly stdout?: (text: string) => void;
  readonly stderr?: (text: string) => void;
}

function safeOutputPath(
  cwd: string,
  value: string | undefined,
  format: EvaluationOutputFormat,
): string | undefined {
  if (value === undefined) return undefined;
  const path = isAbsolute(value) ? resolve(value) : resolve(cwd, value);
  const relativePath = relative(cwd, path);
  if (
    relativePath === '' ||
    relativePath.startsWith('..') ||
    isAbsolute(relativePath) ||
    extname(path).toLowerCase() !== (format === 'json' ? '.json' : '.md')
  ) {
    throw new EvaluationError(
      'unsafe_output_path',
      'Evaluation output must be a matching .json or .md file inside the workspace.',
    );
  }
  return path;
}

async function writeReport(path: string, content: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, { encoding: 'utf8', flag: 'wx' });
  } catch {
    throw new EvaluationError(
      'report_write_failed',
      'Evaluation report could not be written; choose a new output path.',
    );
  }
}

function liveAnalyzer(): EvaluationAnalyzer {
  return (issue) => analyzeIssue(issue);
}

function failureMessage(error: unknown): string {
  if (error instanceof EvaluationError || error instanceof ConfigError) {
    return `Evaluation error [${error instanceof EvaluationError ? error.code : 'invalid_config'}]: ${error.message}`;
  }
  return 'Evaluation failed safely [unexpected_error].';
}

export async function runEvaluationCli(
  args: readonly string[],
  dependencies: EvaluationCliDependencies = {},
): Promise<number> {
  const stdout = dependencies.stdout ?? console.log;
  const stderr = dependencies.stderr ?? console.error;
  const cwd = resolve(dependencies.cwd ?? process.cwd());

  try {
    const options = parseEvaluationArgs(args);
    if (options.help) {
      stdout(EVALUATION_USAGE);
      return 0;
    }
    if (options.mode === 'live' && !options.confirmLive) {
      throw new EvaluationError(
        'live_confirmation_required',
        'Live mode can make up to 30 paid Jev requests. Re-run explicitly with --confirm-live and preferably --limit 1.',
      );
    }

    const outputPath = safeOutputPath(cwd, options.outputPath, options.format);
    const datasetPath = resolve(
      cwd,
      options.datasetPath ?? DEFAULT_DATASET_PATH,
    );
    const dataset = await loadEvaluationDataset(datasetPath);
    if (options.limit !== undefined && options.limit > dataset.issues.length) {
      throw new EvaluationError(
        'invalid_arguments',
        '--limit cannot exceed the dataset size.',
      );
    }
    if (dependencies.env === undefined) {
      await (
        dependencies.loadEnvironment ??
        ((): Promise<void> => {
          loadDotenv({ quiet: true });
          return Promise.resolve();
        })
      )();
    }
    const env = dependencies.env ?? process.env;
    const config = loadConfig(env);

    let analyzer: EvaluationAnalyzer;
    if (options.mode === 'fixture') {
      const fixtures = await loadFixtureDataset(
        resolve(cwd, options.fixturesPath ?? DEFAULT_FIXTURES_PATH),
        dataset,
      );
      analyzer = (dependencies.fixtureAnalyzerFactory ?? createFixtureAnalyzer)(
        fixtures,
      );
    } else {
      if (!config.typesafeApiKey) {
        throw new EvaluationError(
          'missing_api_key',
          'TYPESAFE_API_KEY is required after live evaluation is explicitly confirmed.',
        );
      }
      analyzer = dependencies.liveAnalyzer ?? liveAnalyzer();
    }

    const report = await runEvaluation({
      dataset,
      analyzer,
      mode: options.mode === 'live' ? 'live-jev' : 'offline-fixture',
      config,
      ...(options.limit === undefined ? {} : { limit: options.limit }),
    });
    const rendered =
      options.format === 'json'
        ? renderEvaluationJson(report)
        : renderEvaluationMarkdown(report);
    if (outputPath === undefined) stdout(rendered);
    else {
      await writeReport(outputPath, rendered);
      stdout(`Evaluation report written: ${relative(cwd, outputPath)}`);
    }
    return report.summary.accounting.failed === 0 ? 0 : 1;
  } catch (error: unknown) {
    stderr(failureMessage(error));
    return error instanceof EvaluationError &&
      error.code === 'invalid_arguments'
      ? 2
      : 1;
  }
}
