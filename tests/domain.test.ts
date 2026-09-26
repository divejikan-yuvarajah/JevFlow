import { describe, expect, it } from 'vitest';

import {
  AUTOMATION_MODES,
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
  isAutomationMode,
  isEngineeringArea,
  isIssuePriority,
  isIssueType,
} from '../src/domain/constants.js';

describe('canonical domain vocabulary', () => {
  it('contains the required options', () => {
    expect(ISSUE_TYPES).toEqual([
      'bug',
      'feature',
      'documentation',
      'question',
      'maintenance',
    ]);
    expect(ENGINEERING_AREAS).toEqual([
      'frontend',
      'backend',
      'database',
      'devops',
      'ai',
      'security',
      'general',
    ]);
    expect(PRIORITIES).toEqual(['critical', 'high', 'medium', 'low']);
    expect(AUTOMATION_MODES).toEqual([
      'auto',
      'review-suggested',
      'human-review',
    ]);
  });

  it.each([
    [ISSUE_TYPES],
    [ENGINEERING_AREAS],
    [PRIORITIES],
    [AUTOMATION_MODES],
  ])('contains no duplicate values', (values) => {
    expect(new Set(values).size).toBe(values.length);
  });

  it('provides guards for accepted and rejected values', () => {
    expect(isIssueType('bug')).toBe(true);
    expect(isIssueType('incident')).toBe(false);
    expect(isEngineeringArea('security')).toBe(true);
    expect(isEngineeringArea('mobile')).toBe(false);
    expect(isIssuePriority('critical')).toBe(true);
    expect(isIssuePriority('urgent')).toBe(false);
    expect(isAutomationMode('human-review')).toBe(true);
    expect(isAutomationMode('unattended')).toBe(false);
  });
});
