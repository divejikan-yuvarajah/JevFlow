import { performance } from 'node:perf_hooks';

import type { IssueInput } from '../domain/issue.js';
import { createJevProvider } from '../jev/client.js';
import { JEV_QUESTIONS } from '../jev/questions.js';
import { buildJevState } from '../jev/state.js';
import type { JevProvider, JevSystemOneResponse } from '../jev/types.js';
import { normalizeJevResult } from './normalizeResult.js';
import { TriageError, type TriageResult } from './triage.types.js';

export interface AnalyzeIssueDependencies {
  readonly provider?: JevProvider;
  readonly now?: () => number;
}

export async function analyzeIssue(
  issue: IssueInput,
  dependencies: AnalyzeIssueDependencies = {},
): Promise<TriageResult> {
  const builtState = buildJevState(issue);
  const provider = dependencies.provider ?? createJevProvider();
  const now = dependencies.now ?? performance.now.bind(performance);
  const startedAt = now();

  let response: JevSystemOneResponse;
  try {
    response = await provider.systemOne({
      state: builtState.state,
      questions: JEV_QUESTIONS,
    });
  } catch (error: unknown) {
    if (error instanceof TriageError) throw error;
    throw new TriageError(
      'provider_unavailable',
      'The Jev provider request could not be completed.',
    );
  }

  return normalizeJevResult(response, {
    latencyMs: Math.max(0, now() - startedAt),
    inputTruncated: builtState.inputTruncated,
    truncatedFields: builtState.truncatedFields,
  });
}
