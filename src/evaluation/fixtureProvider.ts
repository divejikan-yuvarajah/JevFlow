import {
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
  type EngineeringArea,
  type IssuePriority,
  type IssueType,
} from '../domain/constants.js';
import type { ChoiceDecision, TriageResult } from '../triage/triage.types.js';
import {
  EvaluationError,
  type EvaluationAnalyzer,
  type FixtureDataset,
} from './evaluation.types.js';

function probabilities<T extends string>(
  values: readonly T[],
  selected: T,
  selectedProbability: number,
): Readonly<Record<T, number>> {
  const alternativeProbability =
    values.length === 1 ? 0 : (1 - selectedProbability) / (values.length - 1);
  return Object.fromEntries(
    values.map((value) => [
      value,
      value === selected ? selectedProbability : alternativeProbability,
    ]),
  ) as Readonly<Record<T, number>>;
}

function choice<T extends string>(
  values: readonly T[],
  value: T,
  selectedProbability: number,
  confidence: number,
): ChoiceDecision<T> {
  return {
    value,
    selectedProbability,
    confidence,
    probabilities: probabilities(values, value, selectedProbability),
  };
}

export function fixtureToTriageResult(
  fixture: FixtureDataset['fixtures'][number],
): TriageResult {
  return {
    issueType: choice<IssueType>(
      ISSUE_TYPES,
      fixture.issueType.value,
      fixture.issueType.selectedProbability,
      fixture.issueType.confidence,
    ),
    engineeringArea: choice<EngineeringArea>(
      ENGINEERING_AREAS,
      fixture.engineeringArea.value,
      fixture.engineeringArea.selectedProbability,
      fixture.engineeringArea.confidence,
    ),
    priority: choice<IssuePriority>(
      PRIORITIES,
      fixture.priority.value,
      fixture.priority.selectedProbability,
      fixture.priority.confidence,
    ),
    securitySensitive: {
      probabilityYes: fixture.securityProbabilityYes,
    },
    needsHumanReview: {
      probabilityYes: fixture.humanReviewProbabilityYes,
    },
    meta: {
      model: 'synthetic-fixture',
      latencyMs: 0,
      inputTruncated: fixture.inputTruncated,
      truncatedFields: fixture.inputTruncated ? ['body'] : [],
      usage: { inputTokens: 0, outputTokens: 0 },
    },
  };
}

export function createFixtureAnalyzer(
  fixtures: FixtureDataset,
): EvaluationAnalyzer {
  const byId = new Map(
    fixtures.fixtures.map((fixture) => [fixture.id, fixture] as const),
  );
  return (_issue, context) => {
    const fixture = byId.get(context.id);
    if (fixture === undefined) {
      return Promise.reject(
        new EvaluationError(
          'invalid_fixtures',
          'No synthetic fixture exists for the evaluation record.',
        ),
      );
    }
    return Promise.resolve(fixtureToTriageResult(fixture));
  };
}
