'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const PRIMARY_LINKS = [
  { href: '/diagnose', label: 'Diagnose' },
  { href: '/for-providers', label: 'For Providers' },
] as const;

const SHEET_LINKS = [
  { href: '/diagnose', label: 'Diagnose my problem', kind: 'homeowner' },
  { href: '/my-home', label: 'Look up my home', kind: 'homeowner' },
  { href: '/dashboard', label: 'My dashboard', kind: 'homeowner' },
  { href: '/for-providers', label: "I'm a service pro", kind: 'provider' },
  { href: '/territory', label: 'Territory demand', kind: 'provider' },
  { href: '/provider', label: 'Provider lead inbox', kind: 'provider' },
  { href: '/account/signin', label: 'Sign in', kind: 'misc' },
  { href: '/support', label: 'Support', kind: 'misc' },
  { href: '/privacy', label: 'Privacy', kind: 'misc' },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile sheet on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  return (
    <header className="sticky top-0 z-50 px-2 pt-2 pb-1 sm:px-3">
      {/* Desktop pill */}
      <div className="mx-auto hidden max-w-6xl flex-col items-center md:flex">
        <div
          className="my-4 md:my-6 inline-flex max-w-full min-w-0 flex-nowrap items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-white/80 bg-white/45 px-[22px] py-3 shadow-[0_8px_32px_rgba(15,23,42,0.1)] backdrop-blur-xl"
          role="navigation"
          aria-label="Site"
        >
          <Link
            href="/"
            className="ml-0 mr-4 shrink-0 pl-[10px] pr-4 text-lg font-bold tracking-tight text-od-navy sm:pl-[22px] sm:text-xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            🏠 Odosan
          </Link>
          <nav className="flex shrink-0 items-center justify-center gap-2" aria-label="Main">
            {PRIMARY_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname?.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-od-primary-soft text-od-navy'
                      : 'text-gray-600 hover:bg-od-primary-soft hover:text-od-navy'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
            <Link
              href="/account/signin?next=/provider"
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-od-primary-soft hover:text-od-navy"
            >
              Provider sign in
            </Link>
          </nav>
          <div className="ml-2 flex shrink-0 items-center pr-0.5 sm:pr-1">
            <Link
              href="/diagnose"
              className="inline-flex items-center justify-center rounded-full bg-od-navy px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-od-navy/90 sm:py-2"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile bar */}
      <div className="mx-auto flex max-w-6xl items-center gap-2 md:hidden">
        <div className="flex min-h-[52px] min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/80 bg-white/55 px-3 py-2 shadow-[0_8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <Link
            href="/"
            className="shrink-0 text-lg font-bold tracking-tight text-od-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            🏠 Odosan
          </Link>
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <Link
              href="/diagnose"
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full bg-od-navy px-4 text-sm font-semibold text-white shadow-sm hover:bg-od-navy/90"
            >
              Diagnose
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-full border border-od-navy/15 bg-white text-od-navy hover:bg-od-primary-soft"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-od-navy/40 backdrop-blur-sm"
          />
          <div className="absolute right-0 top-0 flex h-full w-[85%] max-w-sm flex-col bg-od-bg shadow-2xl">
            <div className="flex items-center justify-between border-b border-od-navy/10 px-5 py-4">
              <span
                className="text-lg font-bold text-od-navy"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                🏠 Odosan
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-od-navy/15 bg-white text-od-navy hover:bg-od-primary-soft"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
              {SHEET_LINKS.map(({ href, label }) => {
                const active = pathname === href || pathname?.startsWith(href + '/');
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                      active
                        ? 'bg-od-primary-soft text-od-navy'
                        : 'text-od-navy hover:bg-od-primary-soft'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-od-navy/10 px-5 py-4">
              <a
                href="mailto:contact@odosan.care"
                className="text-sm text-od-muted hover:text-od-navy"
              >
                contact@odosan.care
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
