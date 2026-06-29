'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { signOut, useSession } from '@/lib/auth-client';

// Minimal header: brand logo + wordmark linking to the landing page, plus
// an auth chip on the right so the user always knows whether their work
// will land in their account or just in this browser.
export function SiteHeader() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-od-navy/5 bg-od-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icon-192.png"
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-8"
            aria-hidden="true"
          />
          <span
            className="text-lg font-bold tracking-tight text-od-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Odosan
          </span>
        </Link>

        <div className="flex shrink-0 items-center">
          {isPending ? (
            <div className="h-7 w-16 animate-pulse rounded-full bg-od-track" aria-hidden="true" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full bg-od-primary-soft px-1.5 py-1 text-sm font-semibold text-od-navy hover:bg-od-primary-soft/80"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[16px] leading-none">
                  <span aria-hidden="true">{pickEmojiAvatar(user.id || user.email || 'guest')}</span>
                </span>
                <span className="hidden max-w-[120px] truncate pr-1 sm:inline">
                  {user.name?.split(' ')[0] || user.email}
                </span>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-od-border bg-white shadow-[0_8px_20px_rgba(27,56,42,0.10)]"
                >
                  <div className="border-b border-od-border px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-od-muted">Signed in as</p>
                    <p className="truncate text-sm font-semibold text-od-navy">
                      {user.name || user.email}
                    </p>
                    {user.name && user.email && (
                      <p className="truncate text-xs text-od-muted">{user.email}</p>
                    )}
                  </div>
                  <Link
                    href="/my-home"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-od-navy hover:bg-od-track"
                    role="menuitem"
                  >
                    My home
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setMenuOpen(false);
                      await signOut();
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-od-red hover:bg-od-red-soft/50"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/account/signin"
              className="rounded-full bg-od-primary-soft px-3 py-1.5 text-sm font-semibold text-od-navy hover:bg-od-primary-soft/80"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

// Six lightweight emoji avatars rotated deterministically per user. Each
// homeowner always sees the same emoji for themselves (and for anyone
// else they encounter), so it functions like a stable identicon.
const EMOJI_AVATARS = ['😎', '🤠', '🥸', '🧑‍🔧', '🦊', '🐻'] as const;

function pickEmojiAvatar(seed: string): string {
  // Plain DJB2-style hash — fast, no crypto needed for a non-secret pick.
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  }
  return EMOJI_AVATARS[h % EMOJI_AVATARS.length];
}
