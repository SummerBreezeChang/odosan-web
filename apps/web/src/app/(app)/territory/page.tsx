'use client';

import { useEffect, useState } from 'react';

type Territory = {
  zip: string;
  homes_count: number;
  demand: Record<string, number>;
};

const TRADE_LABELS: Record<string, string> = {
  roof: 'Roofing',
  water_heater: 'Water heater',
  hvac: 'HVAC',
  electrical: 'Electrical',
  gutters: 'Gutters',
  solar: 'Solar',
};

const TRADE_BG: Record<string, string> = {
  roof: 'bg-od-orange-soft text-od-orange',
  water_heater: 'bg-od-primary-soft text-od-primary',
  hvac: 'bg-od-green-soft text-od-green',
  electrical: 'bg-od-red-soft text-od-red',
  gutters: 'bg-od-track text-od-muted',
  solar: 'bg-od-cream text-od-navy',
};

export default function Territory() {
  const [summaries, setSummaries] = useState<Territory[]>([]);
  const [selected, setSelected] = useState<Territory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/territory');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load territories');
        setSummaries(data.summaries ?? []);
        if (data.summaries?.length) setSelected(data.summaries[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load territories');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <h1
          className="text-4xl font-bold text-od-navy mb-3 tracking-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Territory demand
        </h1>
        <p className="text-base text-od-muted">
          Aggregate demand by ZIP. Per-home addresses are never exposed here — that&apos;s the
          privacy line. You get a feel for where the work is so you can decide which areas to
          serve.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-od-red/20 bg-od-red-soft px-4 py-3 text-sm text-od-red">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-8 flex items-center gap-3 text-od-muted">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-od-navy/10 border-t-od-navy" />
            Loading territories...
          </div>
        )}

        {!loading && summaries.length > 0 && (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
              ZIPs in pilot
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {summaries.map((s) => {
                const active = selected?.zip === s.zip;
                return (
                  <button
                    key={s.zip}
                    type="button"
                    onClick={() => setSelected(s)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-od-navy text-white'
                        : 'border border-od-navy/15 bg-white text-od-navy hover:bg-od-primary-soft'
                    }`}
                  >
                    {s.zip}
                    <span className="ml-2 text-xs opacity-70">{s.homes_count} homes</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
                Territory {selected.zip}
              </p>
              <h2
                className="mt-1 text-2xl font-bold text-od-navy sm:text-3xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {selected.homes_count} homes in the pilot
              </h2>
            </div>
            <span className="rounded-full bg-od-green-soft px-3 py-1 text-xs font-semibold text-od-green">
              Aggregate only · no addresses
            </span>
          </div>

          <h3 className="mt-8 text-sm font-semibold uppercase tracking-wide text-od-primary">
            Demand by trade
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Object.entries(selected.demand).map(([trade, count]) => {
              const pct =
                selected.homes_count > 0
                  ? Math.round((count / selected.homes_count) * 100)
                  : 0;
              const accent = TRADE_BG[trade] ?? 'bg-od-track text-od-muted';
              return (
                <div
                  key={trade}
                  className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                >
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${accent}`}
                  >
                    {TRADE_LABELS[trade] ?? trade}
                  </span>
                  <p className="mt-3 text-3xl font-bold text-od-navy">{count}</p>
                  <p className="text-xs text-od-muted">
                    {pct}% of {selected.homes_count}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-2xl border border-od-primary/15 bg-od-primary-soft p-4 text-sm text-od-navy">
            <p className="font-semibold">Why these numbers ≠ leads.</p>
            <p className="mt-1 text-od-muted">
              Demand counts come from estimated system ages on every home in the pilot — what
              <em> could </em>need attention. A lead only arrives when a homeowner submits a
              problem on Odosan and consents to share their contact info with you.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/provider"
              className="inline-flex items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90"
            >
              Open lead inbox →
            </a>
            <a
              href="/for-providers"
              className="inline-flex items-center justify-center rounded-xl border border-od-navy/15 bg-white px-5 py-2.5 text-sm font-semibold text-od-navy hover:bg-od-primary-soft"
            >
              How the model works
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
