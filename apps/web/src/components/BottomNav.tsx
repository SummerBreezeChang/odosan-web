'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Persistent bottom action strip — thumb-zone navigation pattern borrowed
 * from Granola. Two slots: a compact 'My home' icon button on the left,
 * a primary 'Diagnose a problem' pill on the right. Always visible across
 * (app) routes so the homeowner's two most common actions are one tap away
 * regardless of where they are in the app.
 *
 * Safe-area-inset-bottom keeps it above the iPhone home indicator on
 * standalone PWA installs.
 */
export function BottomNav() {
  const pathname = usePathname();

  // Hide on auth pages — they have their own focused flow and a floating
  // CTA would compete with the form.
  if (pathname?.startsWith('/account/')) return null;

  const isOnMyHome = pathname === '/my-home' || pathname?.startsWith('/my-home/');
  const isOnDiagnose = pathname?.startsWith('/diagnose');

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
      aria-label="Primary actions"
    >
      <div className="pointer-events-auto mx-auto flex max-w-xl items-center justify-between gap-3 rounded-full border border-od-border bg-white/90 px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md">
        <Link
          href="/my-home"
          aria-label="My home"
          className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
            isOnMyHome ? 'bg-od-cream text-od-primary' : 'bg-od-cream/60 text-od-navy hover:bg-od-cream'
          }`}
        >
          <HomeIcon className="h-5 w-5" />
        </Link>

        <Link
          href="/diagnose"
          className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
            isOnDiagnose
              ? 'bg-od-navy/85 text-white'
              : 'bg-od-navy text-white hover:bg-od-navy/90'
          }`}
        >
          <CameraIcon className="h-4 w-4" />
          {isOnDiagnose ? 'Diagnosing…' : 'Diagnose a problem'}
        </Link>
      </div>
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
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
      strokeWidth="2"
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
