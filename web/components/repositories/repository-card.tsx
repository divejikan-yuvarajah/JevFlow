import type { PublicRepository } from '@/lib/github/repository-types';

interface RepositoryCardProps {
  readonly fullName: string;
  readonly repository?: PublicRepository;
  readonly refreshError?: string;
  readonly active: boolean;
  readonly onView: () => void;
  readonly onRefresh: () => void;
  readonly onDisconnect: () => void;
}

export function RepositoryCard({
  fullName,
  repository,
  refreshError,
  active,
  onView,
  onRefresh,
  onDisconnect,
}: RepositoryCardProps) {
  return (
    <article className={`repository-card ${active ? 'active' : ''}`}>
      <div className="repository-card-topline">
        <span className={repository ? 'read-only-badge' : 'stale-badge'}>
          {repository
            ? 'Linked for viewing · read-only'
            : 'Previously linked · unable to refresh'}
        </span>
        {repository?.archived ? (
          <span className="archived-badge">Archived</span>
        ) : null}
      </div>
      <h2>{repository?.fullName ?? fullName}</h2>
      <p>
        {repository?.description ??
          refreshError ??
          'Public metadata is unavailable.'}
      </p>
      {repository ? (
        <dl className="repository-facts">
          <div>
            <dt>Issues</dt>
            <dd>{repository.hasIssues ? 'Enabled' : 'Disabled'}</dd>
          </div>
          <div>
            <dt>Default branch</dt>
            <dd>{repository.defaultBranch}</dd>
          </div>
          <div>
            <dt>GitHub count</dt>
            <dd>{repository.openIssueAndPullRequestCount} open issues + PRs</dd>
          </div>
          <div>
            <dt>Refreshed</dt>
            <dd>{new Date(repository.fetchedAt).toLocaleString()}</dd>
          </div>
        </dl>
      ) : null}
      <div className="repository-actions">
        <button
          type="button"
          className="secondary-button"
          disabled={!repository?.hasIssues}
          onClick={onView}
        >
          View issues
        </button>
        <button type="button" className="text-button" onClick={onRefresh}>
          Refresh
        </button>
        {repository ? (
          <a href={repository.htmlUrl} target="_blank" rel="noreferrer">
            Open on GitHub
          </a>
        ) : null}
        <button
          type="button"
          className="danger-text-button"
          onClick={onDisconnect}
        >
          Disconnect
        </button>
      </div>
    </article>
  );
}
