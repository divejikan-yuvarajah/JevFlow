import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IssueForm } from '@/components/issue-form';
import { PREVIEW_SCENARIOS } from '@/lib/preview-fixtures';
import { saveIssueHandoff } from '@/lib/repositories/issue-handoff';
import { makeLiveView } from './fixtures';

const disabled = {
  liveEnabled: false,
  status: 'disabled' as const,
  message: 'Live Jev is disabled. Offline synthetic preview is ready.',
};

const enabled = {
  liveEnabled: true,
  status: 'available' as const,
  message: 'Live Jev is available for deliberate local requests.',
};

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('issue form', () => {
  it('starts empty and selecting a sample fills labelled inputs', async () => {
    const user = userEvent.setup();
    render(<IssueForm availability={disabled} />);
    expect(screen.getByLabelText('Issue title')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
    expect(
      screen.getByRole('button', { name: 'Run synthetic preview' }),
    ).toBeDisabled();
    await user.click(
      screen.getByRole('button', { name: /Ordinary backend bug/u }),
    );
    expect(screen.getByLabelText('Issue title')).toHaveValue(
      PREVIEW_SCENARIOS[0]!.title,
    );
    expect(screen.getByLabelText('Description')).toHaveValue(
      PREVIEW_SCENARIOS[0]!.body,
    );
  });

  it.each(PREVIEW_SCENARIOS)(
    'renders the $category fixture offline',
    async (scenario) => {
      const user = userEvent.setup();
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      render(<IssueForm availability={disabled} />);
      await user.click(
        screen.getByRole('button', {
          name: new RegExp(scenario.category, 'u'),
        }),
      );
      await user.click(
        screen.getByRole('button', { name: 'Run synthetic preview' }),
      );
      expect(fetchMock).not.toHaveBeenCalled();
      expect(
        screen.getByText('SYNTHETIC PREVIEW — not a Jev result'),
      ).toBeInTheDocument();
    },
  );

  it('previews an unchanged sample without a network request', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<IssueForm availability={disabled} />);
    await user.click(
      screen.getByRole('button', { name: /Ordinary backend bug/u }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Run synthetic preview' }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.getByText('SYNTHETIC PREVIEW — not a Jev result'),
    ).toBeInTheDocument();
  });

  it('invalidates preview when a sample is edited', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<IssueForm availability={disabled} />);
    await user.click(screen.getByRole('button', { name: /Ambiguous report/u }));
    await user.type(screen.getByLabelText('Issue title'), ' edited');
    await user.click(
      screen.getByRole('button', { name: 'Run synthetic preview' }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Preview only supports unmodified sample scenarios',
    );
  });

  it('explains and disables unavailable live mode', () => {
    render(<IssueForm availability={disabled} />);
    expect(
      screen.getByRole('button', { name: /Analyze with Jev/u }),
    ).toBeDisabled();
    expect(screen.getByText(disabled.message)).toBeInTheDocument();
  });

  it('shows the missing-key state without enabling live submission', () => {
    const missingKey = {
      liveEnabled: false,
      status: 'missing-key' as const,
      message: 'Live opt-in is set, but the server credential is missing.',
    };
    render(<IssueForm availability={missingKey} />);
    expect(
      screen.getByRole('button', { name: /Analyze with Jev/u }),
    ).toBeDisabled();
    expect(screen.getByText(missingKey.message)).toBeInTheDocument();
  });

  it('prefills an imported public issue without starting inference', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    saveIssueHandoff(sessionStorage, 'Example/Project', {
      number: 42,
      title: 'Imported public issue',
      body: 'Issue context from GitHub.',
      htmlUrl: 'https://github.com/Example/Project/issues/42',
      state: 'open',
      createdAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-21T10:00:00.000Z',
      labels: [{ name: 'bug', color: 'aabbcc' }],
      authorLogin: 'fixture-author',
      bodyPreview: 'Issue context from GitHub.',
    });

    render(<IssueForm availability={disabled} />);

    await waitFor(() =>
      expect(screen.getByLabelText('Issue title')).toHaveValue(
        'Imported public issue',
      ),
    );
    expect(screen.getByLabelText('Description')).toHaveValue(
      'Issue context from GitHub.',
    );
    expect(
      screen.getByText('Imported from a public GitHub issue'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View source' })).toHaveAttribute(
      'href',
      'https://github.com/Example/Project/issues/42',
    );
    expect(
      screen.getByRole('button', {
        name: 'Live Jev unavailable for imported issue',
      }),
    ).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps Enter as a newline in the description', async () => {
    const user = userEvent.setup();
    render(<IssueForm availability={disabled} />);
    await user.click(
      screen.getByRole('button', { name: /Ordinary backend bug/u }),
    );
    const description = screen.getByLabelText('Description');
    await user.click(description);
    await user.type(description, '{enter}More context');
    expect(description).toHaveValue(
      `${PREVIEW_SCENARIOS[0]!.body}\nMore context`,
    );
    expect(screen.queryByText('Decision ready')).not.toBeInTheDocument();
  });

  it('handles one successful live request and prevents duplicate submission', async () => {
    const user = userEvent.setup();
    let resolveFetch: ((value: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<IssueForm availability={enabled} />);
    await user.click(screen.getByRole('button', { name: /Analyze with Jev/u }));
    await user.type(
      screen.getByLabelText('Issue title'),
      'Synthetic live request',
    );
    const submit = screen.getByRole('button', {
      name: 'Analyze once with Jev',
    });
    fireEvent.click(submit);
    fireEvent.click(submit);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveFetch?.(
      Response.json({ ok: true, result: makeLiveView() }, { status: 200 }),
    );
    expect(await screen.findByText('LIVE JEV RESULT')).toBeInTheDocument();
  });

  it.each([
    [
      'network error',
      () => Promise.reject(new Error('network')),
      /request failed/u,
    ],
    [
      'malformed JSON',
      () => Promise.resolve(new Response('not-json', { status: 502 })),
      /request failed/u,
    ],
    [
      'sanitized server error',
      () =>
        Promise.resolve(
          Response.json(
            {
              ok: false,
              error: {
                code: 'provider_failure',
                message: 'Safe provider failure.',
              },
            },
            { status: 502 },
          ),
        ),
      /Safe provider failure/u,
    ],
  ])('shows a clear %s state', async (_name, response, expected) => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn(response));
    render(<IssueForm availability={enabled} />);
    await user.click(screen.getByRole('button', { name: /Analyze with Jev/u }));
    await user.type(screen.getByLabelText('Issue title'), 'Synthetic request');
    await user.click(
      screen.getByRole('button', { name: 'Analyze once with Jev' }),
    );
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(expected),
    );
  });
});
