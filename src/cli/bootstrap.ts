import { loadConfig, type Environment } from '../config/env.js';

export type OutputWriter = (message: string) => void;

export function runBootstrap(
  env: Environment = process.env,
  write: OutputWriter = console.log,
): void {
  const config = loadConfig(env);

  write('JevFlow — foundation ready');
  write('Mode: local bootstrap only (no Jev/GitHub requests)');
  write('Node runtime: 20+');
  write(`Automatic threshold: ${config.autoThreshold.toFixed(2)}`);
  write(`Review threshold: ${config.reviewThreshold.toFixed(2)}`);
  write('Jev integration: available through analyzeIssue (no request made)');
  write('Confidence policy and local label proposals: ready');
  write('GitHub automation: ready through the guarded Actions runner');
  write('Next phase: Task 05 — testing, evaluation, and benchmarking');
}
