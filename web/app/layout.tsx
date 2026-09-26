import type { Metadata, Viewport } from 'next';
import { AppHeader } from '@/components/app-header';
import { getLiveDemoAvailability } from '@/lib/demo-guards';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'JevFlow — Confidence-Aware Issue Triage',
    template: '%s · JevFlow',
  },
  description:
    'A local-first playground for typed Jev decisions and deterministic GitHub issue triage policy.',
};

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#08090c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const availability = getLiveDemoAvailability();
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <div className="page-glow" aria-hidden="true" />
        <AppHeader availability={availability} />
        {children}
      </body>
    </html>
  );
}
