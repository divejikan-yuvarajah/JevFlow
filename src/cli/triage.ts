import { loadConfig, ConfigError, type AppConfig } from '../config/env.js';
import type { IssueInput } from '../domain/issue.js';
import { getProposedLabels } from '../github/labels.js';
import { evaluateTriagePolicy } from '../policy/confidenceGate.js';
import { PolicyError } from '../policy/policy.types.js';
import { analyzeIssue } from '../triage/analyzeIssue.js';
import { TriageError } from '../triage/triage.types.js';
import { parseTriageArgs } from './triageArgs.js';
import { loadIssueFile } from './triageFile.js';
import {
  buildTriageReport,
  formatHumanReport,
  formatJsonReport,
} from './triageReport.js';
import {
  CliError,
  TRIAGE_USAGE,
  type CliOutputWriter,
  type IssueAnalyzer,
} from './triage.types.js';

export interface TriageCliDependencies {
  readonly analyze?: IssueAnalyzer;
  readonly loadIssue?: (filePath: string) => Promise<IssueInput>;
  readonly getConfig?: () => AppConfig;
  readonly stdout?: CliOutputWriter;
  readonly stderr?: CliOutputWriter;
}

function writeFailure(error: unknown, write: CliOutputWriter): number {
  if (error instanceof CliError) {
    write(
      error.kind === 'usage'
        ? `Error: ${error.message}\n\n${TRIAGE_USAGE}`
        : `Input error: ${error.message}`,
    );
    return 2;
  }
  if (error instanceof ConfigError) {
    write(`Configuration error: ${error.message}`);
    return 2;
  }
  if (error instanceof TriageError) {
    write(`Analysis error [${error.code}]: ${error.message}`);
    return 1;
  }
  if (error instanceof PolicyError) {
    write(`Policy error [${error.code}]: ${error.message}`);
    return 1;
  }
  write('Analysis failed safely.');
  return 1;
}

export async function runTriageCli(
  args: readonly string[],
  dependencies: TriageCliDependencies = {},
): Promise<number> {
  const stdout = dependencies.stdout ?? console.log;
  const stderr = dependencies.stderr ?? console.error;

  let options;
  try {
    options = parseTriageArgs(args);
  } catch (error: unknown) {
    return writeFailure(error, stderr);
  }

  if (options.help) {
    stdout(TRIAGE_USAGE);
    return 0;
  }

  try {
    const issue = await (dependencies.loadIssue ?? loadIssueFile)(
      options.filePath,
    );
    const config = (dependencies.getConfig ?? loadConfig)();
    const result = await (dependencies.analyze ?? analyzeIssue)(issue);
    const plan = evaluateTriagePolicy(result, config);
    const labels = getProposedLabels(result, plan);
    const report = buildTriageReport(issue, result, plan, labels);
    stdout(options.json ? formatJsonReport(report) : formatHumanReport(report));
    return 0;
  } catch (error: unknown) {
    return writeFailure(error, stderr);
  }
}
