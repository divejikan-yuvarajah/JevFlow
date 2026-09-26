import 'dotenv/config';

import { ConfigError } from '../config/env.js';
import { runBootstrap } from './bootstrap.js';

try {
  runBootstrap();
} catch (error: unknown) {
  const message =
    error instanceof ConfigError
      ? error.message
      : 'JevFlow could not load its configuration.';
  console.error(`Configuration error: ${message}`);
  process.exitCode = 1;
}
