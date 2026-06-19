'use client';

import { useState } from 'react';

type SystemStatus = 'ok' | 'watch' | 'due' | 'unknown';

type HomeProfile = {
  parcel_id: string;
  address: string;
  zip: string;
  year_built: number | null;
  owner_type: string | null;
  systems: Record<
    string,
    { age: number | null; status: SystemStatus; confidence: number; basis: string }
  >;
  solar: {
    source: string;
    roof_area_m2: number;
    max_kwp: number;
    max_panel_count: number;
    annual_kwh: number;
    candidate: { rating: string; max_panels: number };
  };
  need_scores: Record<string, number>;
  top_needs: Array<{ trade: string; score: number }>;
};

const SYSTEM_LABELS: Record<string, string> = {
  roof: 'Roof',
  water_heater: 'Water heater',
  hvac: 'HVAC',
  electrical: 'Electrical',
};

const TRADE_LABELS: Record<string, string> = {
  roof: 'Roofing',
  water_heater: 'Water heater',
  hvac: 'HVAC',
  electrical: 'Electrical',
  gutters: 'Gutters',
  solar: 'Solar',
};

const STATUS_STYLE: Record<SystemStatus, { label: string; chip: string; text: string }> = {
  ok: { label: 'OK', chip: 'bg-od-green-soft text-od-green', text: 'text-od-green' },
  watch: { label: 'Watch', chip: 'bg-od-orange-soft text-od-orange', text: 'text-od-orange' },
  due: { label: 'Due', chip: 'bg-od-red-soft text-od-red', text: 'text-od-red' },
  unknown: { label: 'Unknown', chip: 'bg-od-track text-od-muted', text: 'text-od-muted' },
};

export default function MyHome() {
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const res = await fetch(`/api/home-profile?address=${encodeURIComponent(input.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Lookup failed');
      } else {
        setProfile(data.profile);
      }
    } catch (err) {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <h1
          className="text-4xl font-bold text-od-navy mb-3 tracking-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          My home
        </h1>
        <p className="text-base text-od-muted mb-8">
          Enter your address to see your home&apos;s systems, solar potential, and what needs
          attention. Your address never leaves your screen — providers only see aggregate demand
          by ZIP.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="5500 Broadway Terrace, Oakland"
            className="flex-1 rounded-xl border border-od-border bg-white px-4 py-3 text-base text-od-navy placeholder:text-od-subtle focus:border-od-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-od-navy px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-od-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Looking up...' : 'Look up'}
          </button>
        </form>
        <p className="mt-2 text-xs text-od-subtle">
          Sample addresses available in Rockridge, Berkeley Hills, and Elmwood (94609, 94618,
          94705, 94707, 94708).
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-od-red/20 bg-od-red-soft px-4 py-3 text-sm text-od-red">
            {error}
          </div>
        )}
      </div>

      {profile && (
        <>
          {/* Overview */}
          <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
                  Home overview
                </p>
                <h2
                  className="mt-1 text-2xl font-bold text-od-navy sm:text-3xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {profile.address}
                </h2>
              </div>
              <p className="text-sm text-od-muted">
                ZIP {profile.zip}
                {profile.year_built ? ` · Built ${profile.year_built}` : ''}
              </p>
            </div>
          </div>

          {/* System health */}
          <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
              System health
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Object.entries(profile.systems).map(([key, system]) => {
                const style = STATUS_STYLE[system.status] ?? STATUS_STYLE.unknown;
                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-lg font-bold text-od-navy">
                        {SYSTEM_LABELS[key] ?? key}
                      </h4>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.chip}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-od-muted">
                      {system.age !== null ? `~${system.age} years old` : 'Age unknown'}
                    </p>
                    <p className="mt-1 text-xs text-od-subtle">{system.basis}</p>
                    <p className="mt-1 text-xs text-od-subtle">
                      Confidence: {Math.round(system.confidence * 100)}%
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solar */}
          <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
              Solar potential
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="text-xs uppercase text-od-subtle">Roof area</p>
                <p className="mt-1 text-2xl font-bold text-od-navy">
                  {Math.round(profile.solar.roof_area_m2)} m²
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="text-xs uppercase text-od-subtle">Max system</p>
                <p className="mt-1 text-2xl font-bold text-od-navy">
                  {profile.solar.max_kwp} kWp
                </p>
                <p className="text-xs text-od-muted">
                  ~{profile.solar.max_panel_count} panels
                </p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="text-xs uppercase text-od-subtle">Annual production</p>
                <p className="mt-1 text-2xl font-bold text-od-navy">
                  {profile.solar.annual_kwh.toLocaleString()} kWh
                </p>
                <p className="text-xs text-od-muted capitalize">
                  Candidacy: {profile.solar.candidate.rating}
                </p>
              </div>
            </div>
          </div>

          {/* Top needs */}
          <div className="mt-6 mb-10 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
              What to handle next
            </h3>
            <ol className="mt-4 space-y-3">
              {profile.top_needs.map((need, idx) => (
                <li
                  key={need.trade}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-od-navy text-sm font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-base font-bold text-od-navy">
                      {TRADE_LABELS[need.trade] ?? need.trade}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-od-muted">
                    score {need.score.toFixed(1)}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-6">
              <a
                href="/diagnose"
                className="inline-flex items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90"
              >
                Diagnose a specific problem →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
