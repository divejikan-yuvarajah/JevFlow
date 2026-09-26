import type {
  EngineeringArea,
  IssuePriority,
  IssueType,
} from '../../src/domain/constants.js';
import type {
  ChoiceDecision,
  TriageResult,
} from '../../src/triage/triage.types.js';

export interface TriageResultOptions {
  readonly issueType?: IssueType;
  readonly engineeringArea?: EngineeringArea;
  readonly priority?: IssuePriority;
  readonly issueTypeProbability?: number;
  readonly issueTypeConfidence?: number;
  readonly engineeringAreaProbability?: number;
  readonly engineeringAreaConfidence?: number;
  readonly priorityProbability?: number;
  readonly priorityConfidence?: number;
  readonly securityProbabilityYes?: number;
  readonly humanReviewProbabilityYes?: number;
  readonly inputTruncated?: boolean;
}

function issueTypeDecision(
  value: IssueType,
  selectedProbability: number,
  confidence: number,
): ChoiceDecision<IssueType> {
  return {
    value,
    selectedProbability,
    confidence,
    probabilities: {
      bug: value === 'bug' ? selectedProbability : 0,
      feature: value === 'feature' ? selectedProbability : 0,
      documentation: value === 'documentation' ? selectedProbability : 0,
      question: value === 'question' ? selectedProbability : 0,
      maintenance: value === 'maintenance' ? selectedProbability : 0,
    },
  };
}

function areaDecision(
  value: EngineeringArea,
  selectedProbability: number,
  confidence: number,
): ChoiceDecision<EngineeringArea> {
  return {
    value,
    selectedProbability,
    confidence,
    probabilities: {
      frontend: value === 'frontend' ? selectedProbability : 0,
      backend: value === 'backend' ? selectedProbability : 0,
      database: value === 'database' ? selectedProbability : 0,
      devops: value === 'devops' ? selectedProbability : 0,
      ai: value === 'ai' ? selectedProbability : 0,
      security: value === 'security' ? selectedProbability : 0,
      general: value === 'general' ? selectedProbability : 0,
    },
  };
}

function priorityDecision(
  value: IssuePriority,
  selectedProbability: number,
  confidence: number,
): ChoiceDecision<IssuePriority> {
  return {
    value,
    selectedProbability,
    confidence,
    probabilities: {
      critical: value === 'critical' ? selectedProbability : 0,
      high: value === 'high' ? selectedProbability : 0,
      medium: value === 'medium' ? selectedProbability : 0,
      low: value === 'low' ? selectedProbability : 0,
    },
  };
}

export function createTriageResult(
  options: TriageResultOptions = {},
): TriageResult {
  const issueType = options.issueType ?? 'bug';
  const engineeringArea = options.engineeringArea ?? 'backend';
  const priority = options.priority ?? 'medium';
  return {
    issueType: issueTypeDecision(
      issueType,
      options.issueTypeProbability ?? 0.95,
      options.issueTypeConfidence ?? 0.95,
    ),
    engineeringArea: areaDecision(
      engineeringArea,
      options.engineeringAreaProbability ?? 0.95,
      options.engineeringAreaConfidence ?? 0.95,
    ),
    priority: priorityDecision(
      priority,
      options.priorityProbability ?? 0.95,
      options.priorityConfidence ?? 0.95,
    ),
    securitySensitive: {
      probabilityYes: options.securityProbabilityYes ?? 0.1,
    },
    needsHumanReview: {
      probabilityYes: options.humanReviewProbabilityYes ?? 0.1,
    },
    meta: {
      model: 'synthetic-test-model',
      latencyMs: 12.5,
      inputTruncated: options.inputTruncated ?? false,
      truncatedFields: options.inputTruncated ? ['body'] : [],
      usage: { inputTokens: 10, outputTokens: 5 },
    },
  };
}
