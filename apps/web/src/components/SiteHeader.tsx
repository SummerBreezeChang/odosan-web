'use client';

import Link from 'next/link';

// Minimal header: just the wordmark and a single "My home" link.
// All provider / dashboard / territory entry points are intentionally removed
// from the homeowner-facing nav — providers have their own page at /for-providers.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-od-navy/5 bg-od-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3 sm:px-6">
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
        <Link
          href="/my-home"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-od-navy transition-colors hover:text-od-primary"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M3 11l9-8 9 8" />
            <path d="M5 10v10h14V10" />
          </svg>
          My home
        </Link>
      </div>
    </header>
  );
}
