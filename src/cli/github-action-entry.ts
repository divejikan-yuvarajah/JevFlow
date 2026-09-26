import 'dotenv/config';

import { runGitHubAction } from './github-action.js';

process.exitCode = await runGitHubAction();
