'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

type Provider = {
  provider_id: string;
  name: string;
  category: string;
  phone: string;
  areas_served: string[];
  rating: number | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing_drainage: 'Plumbing & Drainage',
  gutters_drainage: 'Gutters & Drainage',
  landscaping: 'Landscaping & Yard',
  roofing: 'Roofing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  pest_control: 'Pest Control',
  handyman: 'Handyman',
  painting: 'Painting',
};

export default function ClaimProviderPage() {
  return (
    <Suspense fallback={null}>
      <ClaimProviderInner />
    </Suspense>
  );
}

function ClaimProviderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Auth gate
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace('/account/signin?next=/account/claim-provider');
    }
  }, [session, sessionLoading, router]);

  // Load unclaimed providers
  useEffect(() => {
    if (!session?.user) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category) params.set('category', category);
    fetch(`/api/providers/unclaimed?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setProviders(d.providers ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [session, query, category]);

  async function claim(providerId: string) {
    setClaiming(providerId);
    setError(null);
    try {
      const res = await fetch('/api/claim-provider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: providerId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to claim');
        setClaiming('');
        return;
      }
      const next = searchParams.get('next') ?? '/provider';
      router.replace(next);
    } catch (err) {
      console.error(err);
      setError('Network error');
      setClaiming('');
    }
  }

  if (sessionLoading || !session?.user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-od-navy/10 border-t-od-navy" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
          One more step
        </p>
        <h1
          className="text-4xl font-bold text-od-navy mb-3 tracking-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Claim your business
        </h1>
        <p className="text-base text-od-muted">
          Search for your business in the East Bay provider directory and claim it. Once claimed,
          your lead inbox shows only jobs matched to your trade and service areas. (Don&apos;t see
          your business? Email{' '}
          <a href="mailto:contact@odosan.care" className="underline">
            contact@odosan.care
          </a>{' '}
          and we&apos;ll add you.)
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by business name or trade (e.g. plumbing, roofing)..."
            className="flex-1 rounded-xl border border-od-border bg-white px-4 py-3 text-base text-od-navy placeholder:text-od-subtle focus:border-od-primary focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-od-border bg-white px-4 py-3 text-base text-od-navy focus:border-od-primary focus:outline-none sm:w-56"
          >
            <option value="">All trades</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-od-red/20 bg-od-red-soft px-4 py-3 text-sm text-od-red">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-2">
          {loading && <p className="text-sm text-od-muted">Loading...</p>}
          {!loading && providers.length === 0 && (
            <p className="text-sm text-od-muted">
              No unclaimed providers matching &ldquo;{query}&rdquo;.
            </p>
          )}
          {providers.map((p) => (
            <div
              key={p.provider_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
            >
              <div className="min-w-0">
                <p className="text-base font-bold text-od-navy">{p.name}</p>
                <p className="text-xs text-od-muted">
                  {CATEGORY_LABELS[p.category] ?? p.category}
                  {p.rating ? ` · ★ ${p.rating}` : ''}
                  {p.areas_served?.length ? ` · ${p.areas_served.slice(0, 3).join(', ')}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => claim(p.provider_id)}
                disabled={claiming === p.provider_id}
                className="inline-flex items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-od-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {claiming === p.provider_id ? 'Claiming...' : 'Claim →'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
