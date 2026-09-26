import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { AppHeader } from '@/components/app-header';
import { getLiveDemoAvailability } from '@/lib/demo-guards';
import './globals.css';

const headingFont = localFont({
  src: '../node_modules/@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2',
  variable: '--font-heading',
  display: 'swap',
  weight: '200 800',
});

const interfaceFont = localFont({
  src: '../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2',
  variable: '--font-interface',
  display: 'swap',
  weight: '100 1000',
});

const technicalFont = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
      weight: '400',
    },
    {
      path: '../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
      weight: '500',
    },
    {
      path: '../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2',
      weight: '600',
    },
  ],
  variable: '--font-technical',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'JevFlow — Confidence-Aware Issue Triage',
    template: '%s · JevFlow',
  },
  description:
    'A local-first playground for typed Jev decisions and deterministic GitHub issue triage policy.',
};

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#F7F8F5',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const availability = getLiveDemoAvailability();
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body
        className={`${headingFont.variable} ${interfaceFont.variable} ${technicalFont.variable}`}
      >
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
