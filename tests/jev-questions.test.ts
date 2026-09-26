import { describe, expect, it } from 'vitest';

import {
  ENGINEERING_AREAS,
  ISSUE_TYPES,
  PRIORITIES,
} from '../src/domain/constants.js';
import {
  ENGINEERING_AREA_CRITERIA,
  ISSUE_TYPE_CRITERIA,
  JEV_QUESTIONS,
  PRIORITY_CRITERIA,
} from '../src/jev/questions.js';

describe('JEV_QUESTIONS', () => {
  it('defines exactly three choices and two NOUL questions', () => {
    expect(Object.keys(JEV_QUESTIONS)).toEqual([
      'issueType',
      'engineeringArea',
      'priority',
      'securitySensitive',
      'needsHumanReview',
    ]);
    expect(JEV_QUESTIONS.issueType.type).toBe('choice');
    expect(JEV_QUESTIONS.engineeringArea.type).toBe('choice');
    expect(JEV_QUESTIONS.priority.type).toBe('choice');
    expect(JEV_QUESTIONS.securitySensitive.type).toBe('noul');
    expect(JEV_QUESTIONS.needsHumanReview.type).toBe('noul');
  });

  it('matches every canonical choice without drift', () => {
    expect(Object.keys(ISSUE_TYPE_CRITERIA)).toEqual([...ISSUE_TYPES]);
    expect(Object.keys(ENGINEERING_AREA_CRITERIA)).toEqual([
      ...ENGINEERING_AREAS,
    ]);
    expect(Object.keys(PRIORITY_CRITERIA)).toEqual([...PRIORITIES]);
    expect(JEV_QUESTIONS.issueType.criteria).toBe(ISSUE_TYPE_CRITERIA);
    expect(JEV_QUESTIONS.engineeringArea.criteria).toBe(
      ENGINEERING_AREA_CRITERIA,
    );
    expect(JEV_QUESTIONS.priority.criteria).toBe(PRIORITY_CRITERIA);
  });

  it('keeps all question instructions in trusted static code', () => {
    const serialized = JSON.stringify(JEV_QUESTIONS);
    expect(serialized).not.toContain('Ignore every instruction');
    expect(serialized).toContain('human judgment');
  });
});
