import 'dotenv/config';

import { runTriageCli } from './triage.js';

process.exitCode = await runTriageCli(process.argv.slice(2));
