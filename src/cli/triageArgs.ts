import { CliError, type TriageCliOptions } from './triage.types.js';

export function parseTriageArgs(args: readonly string[]): TriageCliOptions {
  if (args.includes('--help') || args.includes('-h')) {
    if (args.length !== 1) {
      throw new CliError(
        'usage',
        '--help cannot be combined with other flags.',
      );
    }
    return { help: true };
  }

  let filePath: string | undefined;
  let json = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--file') {
      if (filePath !== undefined) {
        throw new CliError('usage', '--file may be provided only once.');
      }
      const value = args[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw new CliError('usage', '--file requires a path value.');
      }
      filePath = value;
      index += 1;
    } else if (argument === '--json') {
      if (json)
        throw new CliError('usage', '--json may be provided only once.');
      json = true;
    } else {
      throw new CliError('usage', `Unknown argument: ${argument ?? ''}`);
    }
  }

  if (filePath === undefined) {
    throw new CliError('usage', '--file is required for issue analysis.');
  }
  return { help: false, filePath, json };
}
