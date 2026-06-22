'use client';

import Link from 'next/link';

// Minimal header: just the wordmark linking to the landing page.
// Navigation lives in the persistent BottomNav (thumb-zone) per Granola's
// mobile pattern — see components/BottomNav.tsx.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-od-navy/5 bg-od-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-xl items-center justify-center px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="relative inline-block h-7 w-7 overflow-hidden rounded-full bg-od-navy"
          >
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-od-bg" />
          </span>
          <span
            className="text-lg font-bold tracking-tight text-od-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Odosan
          </span>
        </Link>
      </div>
    </header>
  );
}
