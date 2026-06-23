'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Persistent bottom tab nav — three equal-weight tabs: Home, Diagnose,
 * My Home. Active tab gets leaf-green ink + icon stroke; inactives stay
 * muted. The nav never morphs into "Diagnosing…" — loading state is a
 * concern of the in-page button on /diagnose, not of the nav.
 *
 * Safe-area-inset-bottom keeps it above the iPhone home indicator on
 * standalone PWA installs.
 */
export function BottomNav() {
  const pathname = usePathname();

  // Hide on auth pages — focused forms shouldn't compete with a nav.
  if (pathname?.startsWith('/account/')) return null;

  const tabs = [
    { href: '/', label: 'Home', Icon: HomeIcon, match: (p: string) => p === '/' },
    {
      href: '/diagnose',
      label: 'Diagnose',
      Icon: CameraIcon,
      match: (p: string) => p.startsWith('/diagnose'),
    },
    {
      href: '/my-home',
      label: 'Saved',
      Icon: BookmarkIcon,
      match: (p: string) =>
        p === '/my-home' || p.startsWith('/my-home/') || p === '/dashboard',
    },
  ] as const;

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
      aria-label="Primary navigation"
    >
      <div className="pointer-events-auto mx-auto flex max-w-xl items-stretch gap-1 rounded-[18px] border border-od-border bg-white/85 p-1.5 shadow-[0_1px_2px_rgba(27,56,42,0.05),0_10px_26px_rgba(27,56,42,0.08)] backdrop-blur-md">
        {tabs.map(({ href, label, Icon, match }) => {
          const active = pathname ? match(pathname) : false;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-[12px] py-2 text-[11px] font-semibold transition-colors ${
                active
                  ? 'bg-od-primary-soft text-od-leaf'
                  : 'text-od-muted hover:bg-od-track hover:text-od-ink'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  );
}
