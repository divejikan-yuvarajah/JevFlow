import Link from 'next/link';
import type { LiveDemoAvailability } from '@/lib/demo-guards';

interface AppHeaderProps {
  readonly availability: LiveDemoAvailability;
}

export function AppHeader({ availability }: AppHeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="JevFlow playground">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" role="img">
              <path d="M7 7.5h18v8.25c0 6.1-3.72 9.6-9 10.75-5.28-1.15-9-4.65-9-10.75V7.5Z" />
              <path d="m11 16 3.1 3.1L21.5 12" />
            </svg>
          </span>
          <span>
            <strong>JevFlow</strong>
            <small>Confidence-Aware GitHub Issue Triage</small>
          </span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/">Playground</Link>
          <Link href="/evaluation">Evaluation</Link>
        </nav>
        <div className={`live-status status-${availability.status}`}>
          <span aria-hidden="true" />
          {availability.liveEnabled
            ? 'Live Jev available'
            : 'Offline preview ready'}
        </div>
      </div>
    </header>
  );
}
