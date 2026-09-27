import type { PublicIssueDetail } from '@/lib/github/repository-types';

interface RepositoryIssueDetailProps {
  readonly repository: string;
  readonly issue: PublicIssueDetail | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onOpenInPlayground: () => void;
}

export function RepositoryIssueDetail({
  repository,
  issue,
  loading,
  error,
  onOpenInPlayground,
}: RepositoryIssueDetailProps) {
  return (
    <aside className="issue-detail" aria-labelledby="issue-detail-heading">
      <p className="eyebrow">Selected issue</p>
      {loading ? (
        <div className="repository-state" role="status">
          Loading issue details…
        </div>
      ) : null}
      {error ? (
        <div className="repository-state error" role="alert">
          {error}
        </div>
      ) : null}
      {!loading && !error && issue === null ? (
        <div className="repository-state">
          <h2 id="issue-detail-heading">Choose an issue</h2>
          <p>
            Issue text stays plain and is never executed or rendered as raw
            HTML.
          </p>
        </div>
      ) : null}
      {issue ? (
        <div>
          <span className={`issue-state issue-${issue.state}`}>
            {issue.state}
          </span>
          <h2 id="issue-detail-heading">{issue.title}</h2>
          <p className="issue-source">
            {repository}#{issue.number}
          </p>
          <div className="issue-detail-labels">
            {issue.labels.map((label) => (
              <span key={label.name}>{label.name}</span>
            ))}
          </div>
          <p className="issue-body">
            {issue.body || 'No description provided.'}
          </p>
          <div className="issue-detail-actions">
            <button
              type="button"
              className="analyze-button"
              onClick={onOpenInPlayground}
            >
              Open in JevFlow Playground
            </button>
            <a href={issue.htmlUrl} target="_blank" rel="noreferrer">
              View original issue
            </a>
          </div>
          <p className="section-note">
            This only prefills the playground. It does not call Jev or modify
            GitHub.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
