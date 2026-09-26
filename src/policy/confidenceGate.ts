import type { AppConfig } from '../config/env.js';
import {
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
  isEngineeringArea,
  isIssuePriority,
  isIssueType,
  type AutomationMode,
} from '../domain/constants.js';
import type { TriageResult } from '../triage/triage.types.js';
import {
  PolicyError,
  type ChoiceScores,
  type PolicyReasonCode,
  type TriagePlan,
} from './policy.types.js';
import {
  CAUTION_YES_THRESHOLD,
  HUMAN_REVIEW_YES_THRESHOLD,
  SECURITY_REVIEW_YES_THRESHOLD,
} from './thresholds.js';

export type PolicyConfig = Pick<AppConfig, 'autoThreshold' | 'reviewThreshold'>;

const MODE_RANK: Readonly<Record<AutomationMode, number>> = {
  auto: 0,
  'review-suggested': 1,
  'human-review': 2,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireProbability(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 1
  ) {
    throw new PolicyError();
  }
  return value;
}

function validateConfig(config: unknown): PolicyConfig {
  if (!isRecord(config)) throw new PolicyError();
  const autoThreshold = requireProbability(config.autoThreshold);
  const reviewThreshold = requireProbability(config.reviewThreshold);
  if (reviewThreshold > autoThreshold) throw new PolicyError();
  return { autoThreshold, reviewThreshold };
}

function choiceScore(
  decision: unknown,
  allowedValues: readonly string[],
  isAllowed: (value: string) => boolean,
): number {
  if (!isRecord(decision) || typeof decision.value !== 'string') {
    throw new PolicyError();
  }
  if (!isAllowed(decision.value) || !isRecord(decision.probabilities)) {
    throw new PolicyError();
  }

  const selectedProbability = requireProbability(decision.selectedProbability);
  const confidence = requireProbability(decision.confidence);
  for (const value of allowedValues) {
    requireProbability(decision.probabilities[value]);
  }
  const probabilityForSelectedValue = requireProbability(
    decision.probabilities[decision.value],
  );
  if (probabilityForSelectedValue !== selectedProbability) {
    throw new PolicyError();
  }
  return Math.min(selectedProbability, confidence);
}

function yesProbability(value: unknown): number {
  if (!isRecord(value)) throw new PolicyError();
  return requireProbability(value.probabilityYes);
}

function raiseMode(
  current: AutomationMode,
  minimum: AutomationMode,
): AutomationMode {
  return MODE_RANK[minimum] > MODE_RANK[current] ? minimum : current;
}

export function evaluateTriagePolicy(
  result: TriageResult,
  config: PolicyConfig,
): TriagePlan {
  if (!isRecord(result)) throw new PolicyError();
  const thresholds = validateConfig(config);
  if (
    !isRecord(result.issueType) ||
    !isRecord(result.engineeringArea) ||
    !isRecord(result.priority) ||
    !isRecord(result.meta) ||
    typeof result.meta.inputTruncated !== 'boolean'
  ) {
    throw new PolicyError();
  }

  const choiceScores: ChoiceScores = {
    issueType: choiceScore(result.issueType, ISSUE_TYPES, isIssueType),
    engineeringArea: choiceScore(
      result.engineeringArea,
      ENGINEERING_AREAS,
      isEngineeringArea,
    ),
    priority: choiceScore(result.priority, PRIORITIES, isIssuePriority),
  };
  const overallChoiceGateScore = Math.min(
    choiceScores.issueType,
    choiceScores.engineeringArea,
    choiceScores.priority,
  );
  const reasonCodes: PolicyReasonCode[] = [];

  let mode: AutomationMode;
  if (overallChoiceGateScore >= thresholds.autoThreshold) {
    mode = 'auto';
    reasonCodes.push('choice_auto_threshold_met');
  } else if (overallChoiceGateScore >= thresholds.reviewThreshold) {
    mode = 'review-suggested';
    reasonCodes.push('choice_review_threshold_met');
  } else {
    mode = 'human-review';
    reasonCodes.push('choice_below_review_threshold');
  }

  if (result.priority.value === 'critical') {
    mode = raiseMode(mode, 'human-review');
    reasonCodes.push('critical_priority_manual_review');
  }

  const securityProbability = yesProbability(result.securitySensitive);
  const humanReviewProbability = yesProbability(result.needsHumanReview);
  const securityReviewRequested =
    securityProbability >= SECURITY_REVIEW_YES_THRESHOLD;

  if (securityReviewRequested) {
    mode = raiseMode(mode, 'human-review');
    reasonCodes.push('security_probability_manual_review');
  }
  if (humanReviewProbability >= HUMAN_REVIEW_YES_THRESHOLD) {
    mode = raiseMode(mode, 'human-review');
    reasonCodes.push('human_review_probability_manual_review');
  }
  if (
    securityProbability >= CAUTION_YES_THRESHOLD &&
    securityProbability < SECURITY_REVIEW_YES_THRESHOLD
  ) {
    mode = raiseMode(mode, 'review-suggested');
    reasonCodes.push('security_probability_caution');
  }
  if (
    humanReviewProbability >= CAUTION_YES_THRESHOLD &&
    humanReviewProbability < HUMAN_REVIEW_YES_THRESHOLD
  ) {
    mode = raiseMode(mode, 'review-suggested');
    reasonCodes.push('human_review_probability_caution');
  }
  if (result.meta.inputTruncated) {
    mode = raiseMode(mode, 'review-suggested');
    reasonCodes.push('input_truncated_review_suggested');
  }

  return {
    mode,
    choiceScores,
    overallChoiceGateScore,
    thresholdsUsed: {
      auto: thresholds.autoThreshold,
      review: thresholds.reviewThreshold,
    },
    securityReviewRequested,
    inputTruncated: result.meta.inputTruncated,
    reasonCodes,
  };
}
