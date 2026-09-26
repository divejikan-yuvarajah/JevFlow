import type { IssueInput } from '../domain/issue.js';
import type { TriageResult } from '../triage/triage.types.js';

export const TRIAGE_USAGE = `Usage:
  npm run triage -- --help
  npm run triage -- --file <issue.json> [--json]`;

export type TriageCliOptions =
  | { readonly help: true }
  | {
      readonly help: false;
      readonly filePath: string;
      readonly json: boolean;
    };

export type CliOutputWriter = (text: string) => void;
export type IssueAnalyzer = (issue: IssueInput) => Promise<TriageResult>;

export class CliError extends Error {
  public readonly kind: 'usage' | 'input';

  public constructor(kind: 'usage' | 'input', message: string) {
    super(message);
    this.name = 'CliError';
    this.kind = kind;
  }
}
