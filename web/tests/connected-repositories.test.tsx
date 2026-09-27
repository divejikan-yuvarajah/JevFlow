import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectedRepositoriesDashboard } from '@/components/repositories/connected-repositories-dashboard';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const repository = {
  owner: 'Example',
  repo: 'Project',
  fullName: 'Example/Project',
  url: 'https://github.com/Example/Project',
  htmlUrl: 'https://github.com/Example/Project',
  description: 'Fixture repository',
  defaultBranch: 'main',
  openIssueAndPullRequestCount: 1,
  hasIssues: true,
  archived: false,
  visibility: 'public',
  fetchedAt: '2026-09-27T00:00:00.000Z',
};
const summary = {
  number: 1,
  title: 'Synthetic issue',
  state: 'open',
  htmlUrl: 'https://github.com/Example/Project/issues/1',
  createdAt: '2026-09-20T10:00:00.000Z',
  updatedAt: '2026-09-21T10:00:00.000Z',
  labels: [{ name: 'bug' }],
  authorLogin: 'fixture-author',
  bodyPreview: 'Safe authored fixture.',
};
const detail = { ...summary, body: 'Safe authored fixture.' };

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  push.mockReset();
  vi.unstubAllGlobals();
});

describe('connected repositories dashboard', () => {
  it('connects, loads issues, opens detail, and hands off without writes or inference', async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          ok: true,
          data: repository,
          source: 'github-public-api',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          ok: true,
          data: {
            repository,
            issues: [summary],
            page: 1,
            perPage: 20,
            hasNextPage: false,
            source: 'github-public-api',
          },
          source: 'github-public-api',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          ok: true,
          data: { repository, issue: detail },
          source: 'github-public-api',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    render(<ConnectedRepositoriesDashboard />);
    await user.type(
      screen.getByLabelText('Public GitHub repository'),
      'https://github.com/Example/Project',
    );
    await user.click(
      screen.getByRole('button', { name: 'Connect repository' }),
    );
    expect(
      await screen.findByText('Linked for viewing · read-only'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View issues' }));
    await user.click(
      await screen.findByRole('button', { name: /Synthetic issue/u }),
    );
    expect(await screen.findAllByText('Safe authored fixture.')).toHaveLength(
      2,
    );
    await user.click(
      screen.getByRole('button', { name: 'Open in JevFlow Playground' }),
    );
    expect(push).toHaveBeenCalledWith('/');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      fetchMock.mock.calls.every(
        (call) => (call[1] as RequestInit).method === 'GET',
      ),
    ).toBe(true);
    expect(sessionStorage.getItem('jevflow:public-issue-handoff')).toContain(
      'Synthetic issue',
    );
    await user.click(screen.getByRole('button', { name: 'Disconnect' }));
    expect(screen.getByText('No repositories linked yet')).toBeInTheDocument();
    expect(localStorage.getItem('jevflow:linked-public-repositories')).toBe(
      '{"version":1,"repositories":[]}',
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('validates input and disconnects without a GitHub request', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<ConnectedRepositoriesDashboard />);
    await user.type(
      screen.getByLabelText('Public GitHub repository'),
      'https://evil.example/owner/repo',
    );
    await user.click(
      screen.getByRole('button', { name: 'Connect repository' }),
    );
    expect(
      await screen.findByText(/Enter a public GitHub repository/u),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
