import 'server-only';

import { loadConfig, type AppConfig } from '../../dist/config/env.js';
import type { IssueInput } from '../../dist/domain/issue.js';
import { analyzeIssue } from '../../dist/triage/analyzeIssue.js';
import type { TriageResult } from '../../dist/triage/triage.types.js';
import type { PublicTriageView } from './contracts';
import { presentTriageResult } from './present-result';

export interface CoreAdapterDependencies {
  readonly analyze?: (issue: IssueInput) => Promise<TriageResult>;
  readonly config?: Pick<AppConfig, 'autoThreshold' | 'reviewThreshold'>;
}

export async function analyzeWithJevFlowCore(
  issue: IssueInput,
  dependencies: CoreAdapterDependencies = {},
): Promise<PublicTriageView> {
  const result = await (dependencies.analyze ?? analyzeIssue)(issue);
  const config = dependencies.config ?? loadConfig(process.env);
  return presentTriageResult(result, 'live_jev', config);
}
