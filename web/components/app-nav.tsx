'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Playground' },
  { href: '/repositories', label: 'Repositories' },
  { href: '/evaluation', label: 'Evaluation' },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary navigation">
      {links.map((link) => {
        const active =
          link.href === '/'
            ? pathname === '/'
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            href={link.href}
            key={link.href}
            className={active ? 'nav-link-active' : undefined}
            aria-current={active ? 'page' : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
