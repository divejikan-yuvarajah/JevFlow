import Image from 'next/image';
import type { LiveDemoAvailability } from '@/lib/demo-guards';
import { AppNav } from '@/components/app-nav';
import Link from 'next/link';

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
        <AppNav />
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
