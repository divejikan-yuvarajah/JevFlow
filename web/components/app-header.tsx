import Image from 'next/image';
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
          <span className="brand-logo" aria-hidden="true">
            <Image
              className="brand-logo-image"
              src="/jevflow-logo.png"
              alt=""
              width={1448}
              height={1086}
              sizes="(max-width: 440px) 132px, 176px"
              preload
            />
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
