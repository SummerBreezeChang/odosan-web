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

// Pipeline system key → /diagnose category dropdown value
const SYSTEM_TO_CATEGORY: Record<string, string> = {
  roof: 'roofing',
  water_heater: 'plumbing_drainage',
  hvac: 'hvac',
  electrical: 'electrical',
};

// Pipeline trade key (used in top_needs) → /diagnose category dropdown value
// solar intentionally omitted — no current diagnose category for solar install
const TRADE_TO_CATEGORY: Record<string, string> = {
  roof: 'roofing',
  water_heater: 'plumbing_drainage',
  hvac: 'hvac',
  electrical: 'electrical',
  gutters: 'gutters_drainage',
};

// /diagnose category → human label for "Find a [trade]" CTA button
const CATEGORY_TO_FIND_LABEL: Record<string, string> = {
  roofing: 'Find a roofer',
  plumbing_drainage: 'Find a plumber',
  hvac: 'Find an HVAC pro',
  electrical: 'Find an electrician',
  gutters_drainage: 'Find a gutter pro',
};

// ZIP → neighborhood option as it appears on /diagnose's dropdown
const ZIP_TO_NEIGHBORHOOD: Record<string, string> = {
  '94609': 'North Oakland / Rockridge',
  '94618': 'North Oakland / Rockridge',
  '94705': 'Berkeley',
  '94707': 'Berkeley',
  '94708': 'Berkeley',
  '94706': 'Albany',
  '94530': 'El Cerrito',
  '94707-1': 'Kensington',
  '94611': 'Piedmont',
  '94608': 'Emeryville',
  '94501': 'Alameda',
  '94502': 'Alameda',
};

function buildDiagnoseHref(category: string | undefined, zip: string): string {
  if (!category) return '/diagnose';
  const params = new URLSearchParams({ category });
  const n = ZIP_TO_NEIGHBORHOOD[zip];
  if (n) params.set('neighborhood', n);
  return `/diagnose?${params.toString()}`;
}

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
          62 East Bay homes loaded: 12 demo parcels + 50 real Alameda County parcels across 94609,
          94618, 94705, 94707, 94708.
        </p>
        <div className="mt-4 rounded-xl border border-od-primary/15 bg-od-primary-soft px-3 py-2 text-xs text-od-navy">
          <span className="font-semibold">What&apos;s real vs sample:</span>{' '}
          50 homes use{' '}
          <a href="https://data.acgov.org" className="underline" target="_blank" rel="noopener">
            real Alameda County parcels
          </a>{' '}
          (APN, address, coordinates, ownership). Solar candidacy is computed live from{' '}
          <a href="https://www.openstreetmap.org" className="underline" target="_blank" rel="noopener">
            OpenStreetMap
          </a>{' '}
          building footprints +{' '}
          <a href="https://re.jrc.ec.europa.eu/pvg_tools/en/" className="underline" target="_blank" rel="noopener">
            PVGIS
          </a>
          {' '}solar yield for each home&apos;s exact lat/lon. System age estimates use sample
          permit data — Oakland and Berkeley don&apos;t publish permit histories as open data,
          so until we partner directly with their permit offices, real homes show &ldquo;unknown&rdquo;
          status for systems without observed permits.
        </div>

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
                const category = SYSTEM_TO_CATEGORY[key];
                const showCta = category && (system.status === 'due' || system.status === 'watch');
                return (
                  <div
                    key={key}
                    className="flex flex-col rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
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
                    {showCta && (
                      <a
                        href={buildDiagnoseHref(category, profile.zip)}
                        className="mt-3 inline-flex items-center justify-center rounded-xl bg-od-navy px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-od-navy/90"
                      >
                        {CATEGORY_TO_FIND_LABEL[category]} →
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Solar */}
          <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
                Solar potential
              </h3>
              {profile.solar.source === 'osm+pvgis' && (
                <span className="rounded-full bg-od-green-soft px-2.5 py-0.5 text-xs font-semibold text-od-green">
                  Live: OpenStreetMap + PVGIS
                </span>
              )}
            </div>
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
              {profile.top_needs.map((need, idx) => {
                const category = TRADE_TO_CATEGORY[need.trade];
                return (
                  <li
                    key={need.trade}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-od-navy text-sm font-bold text-white">
                        {idx + 1}
                      </span>
                      <span className="text-base font-bold text-od-navy">
                        {TRADE_LABELS[need.trade] ?? need.trade}
                      </span>
                      <span className="text-xs font-semibold text-od-muted">
                        score {need.score.toFixed(1)}
                      </span>
                    </div>
                    {category ? (
                      <a
                        href={buildDiagnoseHref(category, profile.zip)}
                        className="inline-flex items-center justify-center rounded-xl bg-od-navy px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-od-navy/90"
                      >
                        Get matches →
                      </a>
                    ) : (
                      <span className="text-xs text-od-subtle">No provider category yet</span>
                    )}
                  </li>
                );
              })}
            </ol>
            <div className="mt-6">
              <a
                href="/diagnose"
                className="inline-flex items-center justify-center rounded-xl border border-od-navy/15 bg-white px-5 py-2.5 text-sm font-semibold text-od-navy hover:bg-od-primary-soft"
              >
                Diagnose a different problem →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
