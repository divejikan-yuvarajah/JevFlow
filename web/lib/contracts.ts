import {
  AUTOMATION_MODES,
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
  type AutomationMode,
  type EngineeringArea,
  type IssuePriority,
  type IssueType,
} from '../../dist/domain/constants.js';
import {
  APPROVED_LABELS,
  type ProposedLabel,
} from '../../dist/github/labels.js';
import {
  POLICY_REASON_CODES,
  type PolicyReasonCode,
} from '../../dist/policy/policy.types.js';

export type PublicResultSource = 'live_jev' | 'synthetic_fixture';

export interface PublicDecision<T extends string> {
  readonly value: T;
  readonly selectedProbability: number;
  readonly reportedConfidence: number;
}

export interface PublicTriageView {
  readonly source: PublicResultSource;
  readonly issueType: PublicDecision<IssueType>;
  readonly engineeringArea: PublicDecision<EngineeringArea>;
  readonly priority: PublicDecision<IssuePriority>;
  readonly securitySensitiveProbabilityYes: number;
  readonly needsHumanReviewProbabilityYes: number;
  readonly policy: {
    readonly mode: AutomationMode;
    readonly reasonCodes: readonly PolicyReasonCode[];
    readonly overallChoiceGateScore: number;
    readonly thresholdsUsed: {
      readonly auto: number;
      readonly review: number;
    };
    readonly classificationLabelsWithheld: boolean;
  };
  readonly proposedLabels: readonly ProposedLabel[];
  readonly meta: {
    readonly inputTruncated: boolean;
    readonly truncatedFields: readonly ('title' | 'body')[];
    readonly model?: string;
    readonly latencyMs?: number;
    readonly usage?: {
      readonly inputTokens: number;
      readonly outputTokens: number;
    };
  };
}

export interface PublicApiError {
  readonly ok: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

export interface PublicApiSuccess {
  readonly ok: true;
  readonly result: PublicTriageView;
}

export type PublicApiResponse = PublicApiSuccess | PublicApiError;

export class PublicContractError extends Error {
  public constructor() {
    super('The server returned an invalid analysis response.');
    this.name = 'PublicContractError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = [],
): boolean {
  const keys = Object.keys(value);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    keys.every((key) => required.includes(key) || optional.includes(key))
  );
}

function isProbability(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function isNonnegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function includes<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && values.some((entry) => entry === value);
}

function isDecision<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): value is PublicDecision<T[number]> {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      'value',
      'selectedProbability',
      'reportedConfidence',
    ]) &&
    includes(allowed, value.value) &&
    isProbability(value.selectedProbability) &&
    isProbability(value.reportedConfidence)
  );
}

function isPolicy(value: unknown): value is PublicTriageView['policy'] {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'mode',
      'reasonCodes',
      'overallChoiceGateScore',
      'thresholdsUsed',
      'classificationLabelsWithheld',
    ]) ||
    !includes(AUTOMATION_MODES, value.mode) ||
    !Array.isArray(value.reasonCodes) ||
    !value.reasonCodes.every((reason) =>
      includes(POLICY_REASON_CODES, reason),
    ) ||
    new Set(value.reasonCodes).size !== value.reasonCodes.length ||
    !isProbability(value.overallChoiceGateScore) ||
    typeof value.classificationLabelsWithheld !== 'boolean' ||
    !isRecord(value.thresholdsUsed) ||
    !hasOnlyKeys(value.thresholdsUsed, ['auto', 'review']) ||
    !isProbability(value.thresholdsUsed.auto) ||
    !isProbability(value.thresholdsUsed.review)
  ) {
    return false;
  }
  return value.thresholdsUsed.review <= value.thresholdsUsed.auto;
}

function isMeta(
  value: unknown,
  source: PublicResultSource,
): value is PublicTriageView['meta'] {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(
      value,
      ['inputTruncated', 'truncatedFields'],
      ['model', 'latencyMs', 'usage'],
    ) ||
    typeof value.inputTruncated !== 'boolean' ||
    !Array.isArray(value.truncatedFields) ||
    !value.truncatedFields.every(
      (field) => field === 'title' || field === 'body',
    ) ||
    new Set(value.truncatedFields).size !== value.truncatedFields.length ||
    value.inputTruncated !== value.truncatedFields.length > 0
  ) {
    return false;
  }

  const hasMeasuredMeta =
    value.model !== undefined ||
    value.latencyMs !== undefined ||
    value.usage !== undefined;
  if (source === 'synthetic_fixture') return !hasMeasuredMeta;

  return (
    typeof value.model === 'string' &&
    value.model.trim().length > 0 &&
    value.model.length <= 120 &&
    typeof value.latencyMs === 'number' &&
    Number.isFinite(value.latencyMs) &&
    value.latencyMs >= 0 &&
    isRecord(value.usage) &&
    hasOnlyKeys(value.usage, ['inputTokens', 'outputTokens']) &&
    isNonnegativeInteger(value.usage.inputTokens) &&
    isNonnegativeInteger(value.usage.outputTokens)
  );
}

export function isPublicTriageView(value: unknown): value is PublicTriageView {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'source',
      'issueType',
      'engineeringArea',
      'priority',
      'securitySensitiveProbabilityYes',
      'needsHumanReviewProbabilityYes',
      'policy',
      'proposedLabels',
      'meta',
    ]) ||
    (value.source !== 'live_jev' && value.source !== 'synthetic_fixture') ||
    !isDecision(value.issueType, ISSUE_TYPES) ||
    !isDecision(value.engineeringArea, ENGINEERING_AREAS) ||
    !isDecision(value.priority, PRIORITIES) ||
    !isProbability(value.securitySensitiveProbabilityYes) ||
    !isProbability(value.needsHumanReviewProbabilityYes) ||
    !isPolicy(value.policy) ||
    !Array.isArray(value.proposedLabels) ||
    !value.proposedLabels.every((label) => includes(APPROVED_LABELS, label)) ||
    new Set(value.proposedLabels).size !== value.proposedLabels.length ||
    !isMeta(value.meta, value.source)
  ) {
    return false;
  }
  return true;
}

export function parsePublicApiResponse(value: unknown): PublicApiResponse {
  if (!isRecord(value) || typeof value.ok !== 'boolean') {
    throw new PublicContractError();
  }
  if (value.ok) {
    if (
      !hasOnlyKeys(value, ['ok', 'result']) ||
      !isPublicTriageView(value.result)
    ) {
      throw new PublicContractError();
    }
    return { ok: true, result: value.result };
  }
  if (
    !hasOnlyKeys(value, ['ok', 'error']) ||
    !isRecord(value.error) ||
    !hasOnlyKeys(value.error, ['code', 'message']) ||
    typeof value.error.code !== 'string' ||
    value.error.code.length === 0 ||
    value.error.code.length > 80 ||
    typeof value.error.message !== 'string' ||
    value.error.message.length === 0 ||
    value.error.message.length > 240
  ) {
    throw new PublicContractError();
  }
  return {
    ok: false,
    error: { code: value.error.code, message: value.error.message },
  };
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);
}
