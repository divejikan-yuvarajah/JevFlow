import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const MAIN_WORKFLOW = new URL(
  '../../.github/workflows/jevflow-triage.yml',
  import.meta.url,
);
const TARGET_WORKFLOW = new URL(
  '../../deploy/target-repo/jevflow-triage.yml',
  import.meta.url,
);
const TARGET_GUIDE = new URL(
  '../../deploy/target-repo/README.md',
  import.meta.url,
);

function expectCommonWorkflowContract(workflow: string): void {
  expect(workflow).toMatch(/^on:\s*$/mu);
  expect(workflow).toContain('issues:\n    types: [opened]');
  expect(workflow).toContain('workflow_dispatch:');
  expect(workflow).toContain('issue_number:');
  expect(workflow).toContain('type: string');
  expect(workflow).toContain('contents: read');
  expect(workflow).toContain('issues: write');
  expect(workflow).not.toContain('write-all');
  expect(workflow).not.toMatch(
    /pull_request_target|issue_comment|workflow_run/u,
  );
  expect(workflow).toContain('timeout-minutes: 10');
  expect(workflow).toContain('${{ github.repository_id }}');
  expect(workflow).toContain(
    '${{ github.event.issue.number || inputs.issue_number }}',
  );
  expect(workflow).not.toContain('fromJSON(inputs.issue_number)');
  expect(workflow).toContain("node-version: '20'");
  expect(workflow).toContain('package-manager-cache: false');
  expect(workflow).toContain('run: npm ci');
  expect(workflow).toContain('run: npm run triage:github');
  expect(workflow).toContain('GITHUB_TOKEN: ${{ github.token }}');
  expect(workflow).toContain(
    'TYPESAFE_API_KEY: ${{ secrets.TYPESAFE_API_KEY }}',
  );
  expect(workflow).not.toMatch(/gh[pousr]_[A-Za-z0-9_]+/u);

  const actionReferences = [...workflow.matchAll(/uses:\s+[^@\s]+@([^\s]+)/gu)];
  expect(actionReferences.length).toBeGreaterThanOrEqual(2);
  for (const reference of actionReferences) {
    expect(reference[1]).toMatch(/^[a-f0-9]{40}$/u);
  }
}

async function readNormalized(path: URL): Promise<string> {
  return (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
}

describe('GitHub Actions workflow contracts', () => {
  it('keeps the main workflow repository-scoped and least privilege', async () => {
    const workflow = await readNormalized(MAIN_WORKFLOW);

    expectCommonWorkflowContract(workflow);
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).not.toContain('repository: REPLACE_OWNER/jevflow');
    expect(workflow).not.toContain('working-directory: jevflow');
  });

  it('requires configured pinned source checkout in the target template', async () => {
    const workflow = await readNormalized(TARGET_WORKFLOW);

    expectCommonWorkflowContract(workflow);
    expect(workflow).toContain('CONFIGURE BEFORE INSTALL');
    expect(workflow).toContain('repository: REPLACE_OWNER/jevflow');
    expect(workflow).toContain(
      'ref: REPLACE_WITH_FULL_40_CHARACTER_COMMIT_SHA',
    );
    expect(workflow).toContain('path: jevflow');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow.match(/working-directory: jevflow/gu)).toHaveLength(2);
  });

  it('documents default branch, private source, secrets, labels, and paid tests', async () => {
    const guide = await readNormalized(TARGET_GUIDE);

    expect(guide).toContain('CONFIGURE BEFORE INSTALL');
    expect(guide).toContain('default branch');
    expect(guide).toContain('40-character commit SHA');
    expect(guide).toContain('TYPESAFE_API_KEY');
    expect(guide).toContain('private JevFlow repository');
    expect(guide).toContain('narrow read-only source credential');
    expect(guide).toContain('creates missing allowlisted labels');
    expect(guide).toContain('workflow_dispatch');
    expect(guide).toContain('one benign synthetic issue');
  });
});
