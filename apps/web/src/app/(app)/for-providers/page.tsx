'use client';

import { useState } from 'react';
import Link from 'next/link';

function WrenchIcon({ className }: { className?: string }) {
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
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.3 2.3-2.7-.7-.7-2.7z" />
    </svg>
  );
}

export default function ForProvidersWaitlist() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      // Lightweight waitlist capture. Production: wire to your CRM / mailing list.
      // For the demo, just persist locally so the success state is real-looking.
      const list: string[] = JSON.parse(
        window.localStorage.getItem('odosan:pros-waitlist') || '[]'
      );
      if (!list.includes(email.trim())) list.push(email.trim());
      window.localStorage.setItem('odosan:pros-waitlist', JSON.stringify(list));
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Try again?');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-6 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center text-sm font-semibold text-od-navy hover:text-od-primary"
      >
        ← Back to Odosan
      </Link>

      <div className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-od-primary-soft text-od-primary">
        <WrenchIcon className="h-5 w-5" />
      </div>

      <h1
        className="mt-5 text-3xl font-bold text-od-navy tracking-tight sm:text-4xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        For service pros — coming soon.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-od-muted">
        Odosan sends pre-qualified, photo-backed leads to vetted local trades. We&apos;re
        onboarding a small group of partners first. Leave your email and we&apos;ll be in touch.
      </p>

      {submitted ? (
        <div className="mt-8 rounded-2xl border border-od-green/20 bg-od-green-soft p-4 text-sm text-od-green">
          ✓ You&apos;re on the list. We&apos;ll reach out when we&apos;re ready to onboard your trade.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <label htmlFor="pros-email" className="sr-only">
            Email
          </label>
          <input
            id="pros-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            className="w-full rounded-xl border border-od-border bg-white px-4 py-3 text-base text-od-navy placeholder:text-od-subtle focus:border-od-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-od-primary focus-visible:ring-offset-1"
          />
          <button
            type="submit"
            disabled={submitting || !email.trim()}
            className="w-full inline-flex items-center justify-center rounded-2xl bg-od-navy px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-od-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Joining…' : 'Join the waitlist'}
          </button>
          {error && (
            <p className="text-sm text-od-red">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}
