export const ISSUE_TYPES = [
  'bug',
  'feature',
  'documentation',
  'question',
  'maintenance',
] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const ENGINEERING_AREAS = [
  'frontend',
  'backend',
  'database',
  'devops',
  'ai',
  'security',
  'general',
] as const;
export type EngineeringArea = (typeof ENGINEERING_AREAS)[number];

export const PRIORITIES = ['critical', 'high', 'medium', 'low'] as const;
export type IssuePriority = (typeof PRIORITIES)[number];

export const AUTOMATION_MODES = [
  'auto',
  'review-suggested',
  'human-review',
] as const;
export type AutomationMode = (typeof AUTOMATION_MODES)[number];

function includesValue<const T extends readonly string[]>(
  values: T,
  candidate: string,
): candidate is T[number] {
  return values.some((value) => value === candidate);
}

export function isIssueType(value: string): value is IssueType {
  return includesValue(ISSUE_TYPES, value);
}

export function isEngineeringArea(value: string): value is EngineeringArea {
  return includesValue(ENGINEERING_AREAS, value);
}

export function isIssuePriority(value: string): value is IssuePriority {
  return includesValue(PRIORITIES, value);
}

export function isAutomationMode(value: string): value is AutomationMode {
  return includesValue(AUTOMATION_MODES, value);
}
