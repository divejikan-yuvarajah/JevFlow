import { runEvaluationCli } from './evaluate.js';

process.exitCode = await runEvaluationCli(process.argv.slice(2));
