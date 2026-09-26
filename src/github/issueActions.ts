import type { GitHubIssueApi } from './client.js';
import type { IssueTarget } from './github.types.js';
import { LABEL_DEFINITIONS, type ProposedLabel } from './labels.js';
import type { LabelReconciliation } from './reconcileLabels.js';

export type LabelOperationStatus = 'completed' | 'partial' | 'failed';

export interface LabelOperationFailure {
  readonly action: 'ensure' | 'add' | 'remove';
  readonly label?: ProposedLabel;
  readonly code: 'github_api_error';
}

export interface LabelOperationReport {
  readonly status: LabelOperationStatus;
  readonly created: readonly ProposedLabel[];
  readonly added: readonly ProposedLabel[];
  readonly removed: readonly ProposedLabel[];
  readonly unchanged: readonly string[];
  readonly failures: readonly LabelOperationFailure[];
}

function reportStatus(
  successes: number,
  failures: readonly LabelOperationFailure[],
): LabelOperationStatus {
  if (failures.length === 0) return 'completed';
  return successes > 0 ? 'partial' : 'failed';
}

export async function applyLabelReconciliation(
  api: GitHubIssueApi,
  target: IssueTarget,
  plan: LabelReconciliation,
): Promise<LabelOperationReport> {
  const created: ProposedLabel[] = [];
  const added: ProposedLabel[] = [];
  const removed: ProposedLabel[] = [];
  const failures: LabelOperationFailure[] = [];

  for (const label of plan.toAdd) {
    try {
      const outcome = await api.ensureLabel(
        target.repository,
        LABEL_DEFINITIONS[label],
      );
      if (outcome === 'created') created.push(label);
    } catch {
      failures.push({ action: 'ensure', label, code: 'github_api_error' });
      return {
        status: reportStatus(created.length, failures),
        created,
        added,
        removed,
        unchanged: plan.unchanged,
        failures,
      };
    }
  }

  if (plan.toAdd.length > 0) {
    try {
      await api.addLabels(target, plan.toAdd);
      added.push(...plan.toAdd);
    } catch {
      failures.push({ action: 'add', code: 'github_api_error' });
      return {
        status: reportStatus(created.length, failures),
        created,
        added,
        removed,
        unchanged: plan.unchanged,
        failures,
      };
    }
  }

  for (const label of plan.toRemove) {
    try {
      await api.removeLabel(target, label);
      removed.push(label);
    } catch {
      failures.push({ action: 'remove', label, code: 'github_api_error' });
    }
  }

  return {
    status: reportStatus(
      created.length + added.length + removed.length,
      failures,
    ),
    created,
    added,
    removed,
    unchanged: plan.unchanged,
    failures,
  };
}
