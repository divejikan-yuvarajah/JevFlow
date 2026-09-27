import type {
  PublicIssueFilter,
  PublicIssueSummary,
} from '@/lib/github/repository-types';

interface RepositoryIssueListProps {
  readonly issues: readonly PublicIssueSummary[];
  readonly state: PublicIssueFilter;
  readonly search: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly hasNextPage: boolean;
  readonly onStateChange: (state: PublicIssueFilter) => void;
  readonly onSearchChange: (value: string) => void;
  readonly onSelect: (issue: PublicIssueSummary) => void;
  readonly onLoadMore: () => void;
}

export function RepositoryIssueList(props: RepositoryIssueListProps) {
  const query = props.search.trim().toLowerCase();
  const visible = props.issues.filter((issue) =>
    `${issue.title} ${issue.bodyPreview} ${issue.labels.map((label) => label.name).join(' ')}`
      .toLowerCase()
      .includes(query),
  );
  return (
    <section className="repository-issues" aria-labelledby="issues-heading">
      <div className="repository-section-heading">
        <div>
          <p className="eyebrow">Public GitHub API</p>
          <h2 id="issues-heading">Issues</h2>
        </div>
        <span>{props.issues.length} loaded</span>
      </div>
      <div className="issue-toolbar">
        <label>
          <span>Search loaded issues</span>
          <input
            type="search"
            value={props.search}
            onChange={(event) => props.onSearchChange(event.target.value)}
            placeholder="Title, body preview or label"
          />
        </label>
        <label>
          <span>State</span>
          <select
            value={props.state}
            onChange={(event) =>
              props.onStateChange(event.target.value as PublicIssueFilter)
            }
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="all">All</option>
          </select>
        </label>
      </div>
      {props.loading && props.issues.length === 0 ? (
        <div className="repository-state" role="status">
          Loading public issues…
        </div>
      ) : null}
      {props.error ? (
        <div className="repository-state error" role="alert">
          {props.error}
        </div>
      ) : null}
      {!props.loading && !props.error && visible.length === 0 ? (
        <div className="repository-state">
          No matching issues in this fetched page.
        </div>
      ) : null}
      <div className="issue-list">
        {visible.map((issue) => (
          <button
            type="button"
            className="issue-row"
            key={issue.number}
            onClick={() => props.onSelect(issue)}
          >
            <span className={`issue-state issue-${issue.state}`}>
              {issue.state}
            </span>
            <span className="issue-row-copy">
              <strong>
                #{issue.number} · {issue.title}
              </strong>
              <small>{issue.bodyPreview || 'No description provided.'}</small>
              <span className="issue-row-meta">
                Updated {new Date(issue.updatedAt).toLocaleDateString()}{' '}
                {issue.authorLogin ? `· @${issue.authorLogin}` : ''}
              </span>
            </span>
            <span className="issue-labels">
              {issue.labels.slice(0, 4).map((label) => (
                <span key={label.name}>{label.name}</span>
              ))}
            </span>
          </button>
        ))}
      </div>
      {props.hasNextPage ? (
        <button
          type="button"
          className="secondary-button load-more"
          disabled={props.loading}
          onClick={props.onLoadMore}
        >
          {props.loading ? 'Loading…' : 'Load next page'}
        </button>
      ) : null}
    </section>
  );
}
