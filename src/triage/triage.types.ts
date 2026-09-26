import type {
  EngineeringArea,
  IssuePriority,
  IssueType,
} from '../domain/constants.js';

export interface ChoiceDecision<T extends string> {
  readonly value: T;
  readonly selectedProbability: number;
  readonly confidence: number;
  readonly probabilities: Readonly<Record<T, number>>;
}

export interface TriageUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface TriageResult {
  readonly issueType: ChoiceDecision<IssueType>;
  readonly engineeringArea: ChoiceDecision<EngineeringArea>;
  readonly priority: ChoiceDecision<IssuePriority>;
  readonly securitySensitive: { readonly probabilityYes: number };
  readonly needsHumanReview: { readonly probabilityYes: number };
  readonly meta: {
    readonly model: string;
    readonly latencyMs: number;
    readonly inputTruncated: boolean;
    readonly truncatedFields: readonly ('title' | 'body')[];
    readonly usage: TriageUsage;
  };
}

export type TriageErrorCode =
  | 'invalid_input'
  | 'missing_api_key'
  | 'provider_unavailable'
  | 'invalid_response';

export class TriageError extends Error {
  public readonly code: TriageErrorCode;

  public constructor(code: TriageErrorCode, message: string) {
    super(message);
    this.name = 'TriageError';
    this.code = code;
  }
}
