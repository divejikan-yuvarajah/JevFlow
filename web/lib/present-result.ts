import type { AppConfig } from '../../dist/config/env.js';
import { getProposedLabels } from '../../dist/github/labels.js';
import { evaluateTriagePolicy } from '../../dist/policy/confidenceGate.js';
import type { TriageResult } from '../../dist/triage/triage.types.js';
import type { PublicResultSource, PublicTriageView } from './contracts';

type PresentationConfig = Pick<AppConfig, 'autoThreshold' | 'reviewThreshold'>;

export function presentTriageResult(
  result: TriageResult,
  source: PublicResultSource,
  config: PresentationConfig,
): PublicTriageView {
  const plan = evaluateTriagePolicy(result, config);
  const proposedLabels = getProposedLabels(result, plan);
  const measuredMeta =
    source === 'live_jev'
      ? {
          model: result.meta.model,
          latencyMs: result.meta.latencyMs,
          usage: {
            inputTokens: result.meta.usage.inputTokens,
            outputTokens: result.meta.usage.outputTokens,
          },
        }
      : {};

  return {
    source,
    issueType: {
      value: result.issueType.value,
      selectedProbability: result.issueType.selectedProbability,
      reportedConfidence: result.issueType.confidence,
    },
    engineeringArea: {
      value: result.engineeringArea.value,
      selectedProbability: result.engineeringArea.selectedProbability,
      reportedConfidence: result.engineeringArea.confidence,
    },
    priority: {
      value: result.priority.value,
      selectedProbability: result.priority.selectedProbability,
      reportedConfidence: result.priority.confidence,
    },
    securitySensitiveProbabilityYes: result.securitySensitive.probabilityYes,
    needsHumanReviewProbabilityYes: result.needsHumanReview.probabilityYes,
    policy: {
      mode: plan.mode,
      reasonCodes: [...plan.reasonCodes],
      overallChoiceGateScore: plan.overallChoiceGateScore,
      thresholdsUsed: { ...plan.thresholdsUsed },
      classificationLabelsWithheld: plan.mode === 'human-review',
    },
    proposedLabels: [...proposedLabels],
    meta: {
      inputTruncated: result.meta.inputTruncated,
      truncatedFields: [...result.meta.truncatedFields],
      ...measuredMeta,
    },
  };
}
