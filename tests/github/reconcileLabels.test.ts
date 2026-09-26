import { describe, expect, it } from 'vitest';

import { GitHubAutomationError } from '../../src/github/github.types.js';
import {
  reconcileFailureLabels,
  reconcileLabels,
} from '../../src/github/reconcileLabels.js';

describe('reconcileLabels', () => {
  it('adds the proposal and removes only exact stale managed labels', () => {
    const plan = reconcileLabels(
      [
        'community:help-wanted',
        'type:feature',
        'area:frontend',
        'priority:low',
        'jev:review-suggested',
        'jev:auto-triaged-copy',
      ],
      ['type:bug', 'area:backend', 'priority:high', 'jev:auto-triaged'],
    );

    expect(plan.toAdd).toEqual([
      'type:bug',
      'area:backend',
      'priority:high',
      'jev:auto-triaged',
    ]);
    expect(plan.toRemove).toEqual([
      'type:feature',
      'area:frontend',
      'priority:low',
      'jev:review-suggested',
    ]);
    expect(plan.unchanged).toEqual([
      'community:help-wanted',
      'jev:auto-triaged-copy',
    ]);
  });

  it('keeps security-review sticky across later non-security results', () => {
    const plan = reconcileLabels(
      ['security-review', 'jev:human-review'],
      ['type:bug', 'area:backend', 'priority:medium', 'jev:auto-triaged'],
    );

    expect(plan.toAdd).toEqual([
      'type:bug',
      'area:backend',
      'priority:medium',
      'jev:auto-triaged',
    ]);
    expect(plan.toRemove).toEqual(['jev:human-review']);
    expect(plan.unchanged).toEqual(['security-review']);
  });

  it('deduplicates current and proposed labels and produces no changes on rerun', () => {
    const plan = reconcileLabels(
      [
        'type:bug',
        'type:bug',
        'area:backend',
        'priority:medium',
        'jev:auto-triaged',
      ],
      [
        'type:bug',
        'area:backend',
        'priority:medium',
        'jev:auto-triaged',
        'type:bug',
      ],
    );

    expect(plan.toAdd).toEqual([]);
    expect(plan.toRemove).toEqual([]);
    expect(plan.unchanged).toEqual([
      'type:bug',
      'area:backend',
      'priority:medium',
      'jev:auto-triaged',
    ]);
  });

  it('rejects any proposal outside the static allowlist', () => {
    expect(() => reconcileLabels([], ['type:bug', 'attacker:label'])).toThrow(
      GitHubAutomationError,
    );
  });
});

describe('reconcileFailureLabels', () => {
  it('adds human review and removes only stale automation mode markers', () => {
    const plan = reconcileFailureLabels([
      'community:help-wanted',
      'type:feature',
      'area:security',
      'priority:high',
      'jev:auto-triaged',
      'jev:review-suggested',
      'security-review',
    ]);

    expect(plan.toAdd).toEqual(['jev:human-review']);
    expect(plan.toRemove).toEqual(['jev:auto-triaged', 'jev:review-suggested']);
    expect(plan.unchanged).toEqual([
      'community:help-wanted',
      'type:feature',
      'area:security',
      'priority:high',
      'security-review',
    ]);
  });
});
