import type { AutomationMode } from '../domain/constants.js';

export const POLICY_REASON_CODES = [
  'choice_auto_threshold_met',
  'choice_review_threshold_met',
  'choice_below_review_threshold',
  'critical_priority_manual_review',
  'security_probability_manual_review',
  'human_review_probability_manual_review',
  'security_probability_caution',
  'human_review_probability_caution',
  'input_truncated_review_suggested',
] as const;

export type PolicyReasonCode = (typeof POLICY_REASON_CODES)[number];

export interface ChoiceScores {
  readonly issueType: number;
  readonly engineeringArea: number;
  readonly priority: number;
}

export interface TriagePlan {
  readonly mode: AutomationMode;
  readonly choiceScores: ChoiceScores;
  readonly overallChoiceGateScore: number;
  readonly thresholdsUsed: {
    readonly auto: number;
    readonly review: number;
  };
  readonly securityReviewRequested: boolean;
  readonly inputTruncated: boolean;
  readonly reasonCodes: readonly PolicyReasonCode[];
}

export class PolicyError extends Error {
  public readonly code = 'invalid_policy_input' as const;

  public constructor(message = 'Policy input is invalid.') {
    super(message);
    this.name = 'PolicyError';
  }
}
