'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

type SavedHome = {
  parcel_id: string;
  address: string;
  zip: string;
  year_built: number | null;
  top_needs: Array<{ trade: string; score: number }>;
  saved_at: string;
};

type MyLead = {
  lead_id: string;
  category: string;
  problem: string;
  fair_price_range: string;
  severity: 'urgent' | 'soon' | 'monitor';
  neighborhood: string;
  status: string;
  created_at: string;
  quote_count: number;
  min_low: number | null;
  max_high: number | null;
};

const SEVERITY_STYLE: Record<string, string> = {
  urgent: 'bg-od-red-soft text-od-red',
  soon: 'bg-od-orange-soft text-od-orange',
  monitor: 'bg-od-track text-od-muted',
};

const CATEGORY_LABELS: Record<string, string> = {
  plumbing_drainage: 'Plumbing',
  gutters_drainage: 'Gutters',
  landscaping: 'Landscaping',
  roofing: 'Roofing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  pest_control: 'Pest Control',
  handyman: 'Handyman',
  painting: 'Painting',
};

const TRADE_LABELS: Record<string, string> = {
  roof: 'Roof',
  water_heater: 'Water heater',
  hvac: 'HVAC',
  electrical: 'Electrical',
  gutters: 'Gutters',
  solar: 'Solar',
};

export default function HomeownerDashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: sessionLoading } = useSession();
  const [homes, setHomes] = useState<SavedHome[]>([]);
  const [leads, setLeads] = useState<MyLead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.replace('/account/signin?next=/dashboard');
    }
  }, [session, sessionLoading, router]);

  useEffect(() => {
    if (sessionLoading || !session?.user) return;
    (async () => {
      try {
        // If the URL has ?parcel=APN (from /my-home → signup → land here),
        // auto-save it. Idempotent on the API side.
        const pendingParcel = searchParams.get('parcel');
        if (pendingParcel) {
          await fetch('/api/save-home', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parcel_id: pendingParcel }),
          }).catch(() => {});
          // Clean URL so reload doesn't re-fire
          router.replace('/dashboard');
        }

        const [hRes, lRes] = await Promise.all([fetch('/api/my-homes'), fetch('/api/my-leads')]);
        const hData = await hRes.json();
        const lData = await lRes.json();
        setHomes(hData.homes ?? []);
        setLeads(lData.leads ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [session, sessionLoading, searchParams, router]);

  if (sessionLoading || !session?.user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 py-16 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-od-navy/10 border-t-od-navy" />
      </div>
    );
  }

  const userName = session.user.name || session.user.email?.split('@')[0] || 'there';

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Welcome */}
      <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">My Odosan</p>
        <h1
          className="text-4xl font-bold text-od-navy mb-2 tracking-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Welcome back, {userName}.
        </h1>
        <p className="text-base text-od-muted">
          Your saved homes, recent diagnoses, and provider estimates — all in one place.
        </p>
      </div>

      {/* Saved homes */}
      <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2
            className="text-2xl font-bold text-od-navy sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Saved homes
          </h2>
          <Link
            href="/my-home"
            className="text-sm font-semibold text-od-primary hover:underline"
          >
            + Look up another address
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-od-muted">Loading...</p>
        ) : homes.length === 0 ? (
          <p className="mt-4 text-sm text-od-muted">
            You haven&apos;t saved a home yet. <Link href="/my-home" className="underline">Look up an address</Link> and tap &ldquo;Save my home.&rdquo;
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {homes.map((h) => (
              <div
                key={h.parcel_id}
                className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-lg font-bold text-od-navy">{h.address}</p>
                  <p className="text-xs text-od-muted">
                    ZIP {h.zip}
                    {h.year_built ? ` · Built ${h.year_built}` : ''}
                  </p>
                </div>
                {h.top_needs?.length > 0 && (
                  <p className="mt-2 text-xs text-od-subtle">
                    Top needs:{' '}
                    {h.top_needs.slice(0, 3).map((n, i) => (
                      <span key={n.trade}>
                        {i > 0 && ' · '}
                        <span className="font-semibold text-od-navy">{TRADE_LABELS[n.trade] ?? n.trade}</span>
                        {` (${n.score.toFixed(1)})`}
                      </span>
                    ))}
                  </p>
                )}
                <Link
                  href={`/my-home?address=${encodeURIComponent(h.address)}`}
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white hover:bg-od-navy/90"
                >
                  Open home profile →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent diagnoses */}
      <div className="mt-6 mb-10 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <h2
          className="text-2xl font-bold text-od-navy sm:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Recent diagnoses
        </h2>
        <p className="mt-1 text-sm text-od-muted">
          Issues you&apos;ve submitted and any provider estimates that came back.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-od-muted">Loading...</p>
        ) : leads.length === 0 ? (
          <p className="mt-4 text-sm text-od-muted">
            You haven&apos;t submitted any diagnoses yet.{' '}
            <Link href="/diagnose" className="underline">
              Start one
            </Link>
            .
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {leads.map((l) => (
              <div
                key={l.lead_id}
                className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-bold text-od-navy">{l.problem}</p>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      SEVERITY_STYLE[l.severity]
                    }`}
                  >
                    {l.severity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-od-muted">
                  {CATEGORY_LABELS[l.category] ?? l.category} · {l.neighborhood} ·{' '}
                  {new Date(l.created_at).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-od-muted">
                  Fair range: <span className="font-semibold text-od-navy">{l.fair_price_range}</span>
                </p>
                {l.quote_count > 0 ? (
                  <p className="mt-2 text-sm text-od-green">
                    ✓ {l.quote_count} estimate{l.quote_count > 1 ? 's' : ''} received: $
                    {l.min_low}–${l.max_high}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-od-muted">
                    Waiting on provider estimates…
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
