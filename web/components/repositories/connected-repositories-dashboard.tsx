'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RepositoryInputError,
  parseRepositoryInput,
} from '@/lib/github/parse-repository-input';
import type {
  PublicGitHubApiResponse,
  PublicIssueDetail,
  PublicIssueFilter,
  PublicIssuePage,
  PublicIssueSummary,
  PublicRepository,
} from '@/lib/github/repository-types';
import {
  disconnectRepository,
  linkRepository,
  loadLinkedRepositories,
} from '@/lib/repositories/linked-repositories';
import { saveIssueHandoff } from '@/lib/repositories/issue-handoff';
import { RepositoryCard } from './repository-card';
import { RepositoryIssueDetail } from './repository-issue-detail';
import { RepositoryIssueList } from './repository-issue-list';

interface LinkedView {
  readonly fullName: string;
  readonly repository?: PublicRepository;
  readonly refreshError?: string;
}

async function api<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: 'GET', cache: 'no-store' });
  } catch {
    throw new Error(
      'The local server or GitHub is unavailable. Try again later.',
    );
  }
  let payload: PublicGitHubApiResponse<T>;
  try {
    payload = (await response.json()) as PublicGitHubApiResponse<T>;
  } catch {
    throw new Error('The repository service returned an unreadable response.');
  }
  if (!response.ok || !payload.ok) {
    throw new Error(
      payload.ok ? 'The repository request failed.' : payload.error.message,
    );
  }
  return payload.data;
}

function query(path: string, values: Record<string, string | number>): string {
  const params = new URLSearchParams(
    Object.entries(values).map(([key, value]) => [key, String(value)]),
  );
  return `${path}?${params.toString()}`;
}

export function ConnectedRepositoriesDashboard() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [linked, setLinked] = useState<readonly LinkedView[]>([]);
  const [connectState, setConnectState] = useState<'idle' | 'loading'>('idle');
  const [feedback, setFeedback] = useState(
    'Paste a public GitHub repository URL. No authorization is requested.',
  );
  const [active, setActive] = useState<PublicRepository | null>(null);
  const [issues, setIssues] = useState<readonly PublicIssueSummary[]>([]);
  const [issueState, setIssueState] = useState<PublicIssueFilter>('open');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PublicIssueDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function resolve(fullName: string): Promise<LinkedView> {
    try {
      const repository = await api<PublicRepository>(
        query('/api/repositories/resolve', { repository: fullName }),
      );
      return { fullName: repository.fullName, repository };
    } catch (error: unknown) {
      return {
        fullName,
        refreshError:
          error instanceof Error
            ? error.message
            : 'Unable to refresh this repository.',
      };
    }
  }

  useEffect(() => {
    const stored = loadLinkedRepositories(window.localStorage);
    void Promise.all(stored.map(resolve)).then(setLinked);
  }, []);

  async function connect(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    let parsed;
    try {
      parsed = parseRepositoryInput(input);
    } catch (error: unknown) {
      setFeedback(
        error instanceof RepositoryInputError
          ? error.message
          : 'The repository value is invalid.',
      );
      return;
    }
    setConnectState('loading');
    setFeedback('Verifying the public repository with GitHub…');
    try {
      const repository = await api<PublicRepository>(
        query('/api/repositories/resolve', { repository: parsed.fullName }),
      );
      const names = linkRepository(window.localStorage, repository.fullName);
      setLinked((current) =>
        names.map((name) =>
          name.toLowerCase() === repository.fullName.toLowerCase()
            ? { fullName: repository.fullName, repository }
            : (current.find(
                (item) => item.fullName.toLowerCase() === name.toLowerCase(),
              ) ?? { fullName: name }),
        ),
      );
      setInput('');
      setFeedback(
        `${repository.fullName} is linked for read-only viewing in this browser.`,
      );
    } catch (error: unknown) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'The public repository could not be linked.',
      );
    } finally {
      setConnectState('idle');
    }
  }

  async function refresh(fullName: string): Promise<void> {
    setFeedback(`Refreshing ${fullName}…`);
    const refreshed = await resolve(fullName);
    setLinked((current) =>
      current.map((item) =>
        item.fullName.toLowerCase() === fullName.toLowerCase()
          ? refreshed
          : item,
      ),
    );
    setFeedback(
      refreshed.repository
        ? `${refreshed.repository.fullName} refreshed from GitHub.`
        : (refreshed.refreshError ?? 'Refresh failed.'),
    );
  }

  function disconnect(fullName: string): void {
    const names = disconnectRepository(window.localStorage, fullName);
    setLinked((current) =>
      current.filter((item) =>
        names.some(
          (name) => name.toLowerCase() === item.fullName.toLowerCase(),
        ),
      ),
    );
    if (active?.fullName.toLowerCase() === fullName.toLowerCase()) {
      setActive(null);
      setIssues([]);
      setDetail(null);
    }
    setFeedback('Removed from this browser; no GitHub settings were changed.');
  }

  async function loadIssues(
    repository: PublicRepository,
    state: PublicIssueFilter,
    requestedPage: number,
    append: boolean,
  ): Promise<void> {
    setActive(repository);
    setIssuesLoading(true);
    setIssuesError(null);
    setDetail(null);
    try {
      const result = await api<PublicIssuePage>(
        query('/api/repositories/issues', {
          repository: repository.fullName,
          state,
          page: requestedPage,
          perPage: 20,
        }),
      );
      setIssues((current) =>
        append
          ? [
              ...current,
              ...result.issues.filter(
                (issue) =>
                  !current.some((existing) => existing.number === issue.number),
              ),
            ]
          : result.issues,
      );
      setPage(requestedPage);
      setHasNextPage(result.hasNextPage);
    } catch (error: unknown) {
      setIssuesError(
        error instanceof Error ? error.message : 'Issues could not be loaded.',
      );
      if (!append) setIssues([]);
    } finally {
      setIssuesLoading(false);
    }
  }

  async function selectIssue(issue: PublicIssueSummary): Promise<void> {
    if (active === null) return;
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);
    try {
      const result = await api<{
        repository: PublicRepository;
        issue: PublicIssueDetail;
      }>(
        query('/api/repositories/issue', {
          repository: active.fullName,
          number: issue.number,
        }),
      );
      setDetail(result.issue);
    } catch (error: unknown) {
      setDetailError(
        error instanceof Error
          ? error.message
          : 'Issue details could not be loaded.',
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function openInPlayground(): void {
    if (active === null || detail === null) return;
    saveIssueHandoff(window.sessionStorage, active.fullName, detail);
    router.push('/');
  }

  return (
    <>
      <section className="repositories-hero">
        <div>
          <span className="hero-kicker">Read-only GitHub connection</span>
          <h1>Connected Repositories</h1>
          <p>
            Inspect public repository issues and bring selected text into
            JevFlow without granting write access or triggering inference.
          </p>
        </div>
        <div className="repository-trust-card">
          <strong>Public data only</strong>
          <span>No OAuth · no PAT · no GitHub writes</span>
        </div>
      </section>
      <section
        className="connect-repository-panel"
        aria-labelledby="connect-heading"
      >
        <div>
          <p className="eyebrow">Local browser link</p>
          <h2 id="connect-heading">Connect repository</h2>
          <p>
            Use <code>https://github.com/OWNER/REPO</code> or{' '}
            <code>OWNER/REPO</code>.
          </p>
        </div>
        <form onSubmit={(event) => void connect(event)}>
          <label htmlFor="repository-input">Public GitHub repository</label>
          <div className="connect-row">
            <input
              id="repository-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="https://github.com/owner/repository"
              maxLength={240}
              required
            />
            <button
              className="analyze-button"
              type="submit"
              disabled={connectState === 'loading'}
            >
              {connectState === 'loading' ? 'Verifying…' : 'Connect repository'}
            </button>
          </div>
        </form>
        <div className="connection-feedback" role="status" aria-live="polite">
          {feedback}
        </div>
      </section>
      <section className="linked-repositories" aria-labelledby="linked-heading">
        <div className="repository-section-heading">
          <div>
            <p className="eyebrow">Saved in this browser</p>
            <h2 id="linked-heading">Linked repositories</h2>
          </div>
          <span>{linked.length}/5 linked</span>
        </div>
        {linked.length === 0 ? (
          <div className="repository-empty">
            <h3>No repositories linked yet</h3>
            <p>
              Paste the real public URL for your repository. JevFlow will not
              guess an owner or install automation.
            </p>
          </div>
        ) : (
          <div className="repository-card-grid">
            {linked.map((item) => (
              <RepositoryCard
                key={item.fullName.toLowerCase()}
                {...item}
                active={
                  active?.fullName.toLowerCase() === item.fullName.toLowerCase()
                }
                onView={() =>
                  item.repository &&
                  void loadIssues(item.repository, issueState, 1, false)
                }
                onRefresh={() => void refresh(item.fullName)}
                onDisconnect={() => disconnect(item.fullName)}
              />
            ))}
          </div>
        )}
      </section>
      {active ? (
        <div className="repository-browser">
          <RepositoryIssueList
            issues={issues}
            state={issueState}
            search={search}
            loading={issuesLoading}
            error={issuesError}
            hasNextPage={hasNextPage}
            onSearchChange={setSearch}
            onStateChange={(state) => {
              setIssueState(state);
              void loadIssues(active, state, 1, false);
            }}
            onSelect={(issue) => void selectIssue(issue)}
            onLoadMore={() =>
              void loadIssues(active, issueState, page + 1, true)
            }
          />
          <RepositoryIssueDetail
            repository={active.fullName}
            issue={detail}
            loading={detailLoading}
            error={detailError}
            onOpenInPlayground={openInPlayground}
          />
        </div>
      ) : null}
      <section className="workflow-note">
        <div>
          <p className="eyebrow">Automation remains separate</p>
          <h2>Viewing a repository does not install JevFlow</h2>
        </div>
        <p>
          To automate triage, install the reviewed workflow on the target
          repository’s default branch and configure its secret separately.
          Workflow presence alone would not prove that inference or permissions
          work.
        </p>
        <p className="section-note">
          Setup details: <code>docs/connected-repositories.md</code>
        </p>
      </section>
    </>
  );
}
