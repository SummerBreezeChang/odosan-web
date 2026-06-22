'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import {
  ALL_SYSTEM_TYPES,
  SYSTEM_LABELS,
  loadHomeRecord,
  type DiagnosisBrief,
  type SystemRecord,
  type SystemType,
} from '@/lib/home-record';
import {
  TIMELINE_LABELS,
  TIMELINE_ORDER,
  bucketFor,
  computeHealthScore,
  computeMoneyPlan,
  forecastSystem,
  formatUSD,
  type SystemForecast,
  type TimelineBucket,
} from '@/lib/home-economics';

type HomeProfile = {
  parcel_id: string;
  address: string;
  zip: string;
  year_built: number | null;
  owner_type: string | null;
  systems: Record<string, unknown>;
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

const SYSTEM_TO_CATEGORY: Record<SystemType, string> = {
  water_heater: 'plumbing_drainage',
  hvac: 'hvac',
  electrical_panel: 'electrical',
  roof_invoice: 'roofing',
};

const ZIP_TO_NEIGHBORHOOD: Record<string, string> = {
  '94609': 'North Oakland / Rockridge',
  '94618': 'North Oakland / Rockridge',
  '94705': 'Berkeley',
  '94707': 'Berkeley',
  '94708': 'Berkeley',
};

function buildDiagnoseHref(
  category: string,
  zip: string,
  parcelId: string,
  address: string
): string {
  const params = new URLSearchParams({ category, parcel_id: parcelId, address });
  const n = ZIP_TO_NEIGHBORHOOD[zip];
  if (n) params.set('neighborhood', n);
  return `/diagnose?${params.toString()}`;
}

export default function MyHomePage() {
  return (
    <Suspense fallback={null}>
      <MyHome />
    </Suspense>
  );
}

function MyHome() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [input, setInput] = useState('');
  const [profile, setProfile] = useState<HomeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savedParcels, setSavedParcels] = useState<Set<string>>(new Set());
  const [savingHome, setSavingHome] = useState(false);
  const [systems, setSystems] = useState<SystemRecord[]>([]);
  const [briefs, setBriefs] = useState<DiagnosisBrief[]>([]);

  // Load locally-documented systems + briefs for the current parcel.
  useEffect(() => {
    if (!profile) {
      setSystems([]);
      setBriefs([]);
      return;
    }
    const rec = loadHomeRecord(profile.parcel_id);
    setSystems(rec.systems);
    setBriefs(rec.briefs);
  }, [profile]);

  // Re-load when the user comes back from the document/diagnose page.
  useEffect(() => {
    function onFocus() {
      if (profile) {
        const rec = loadHomeRecord(profile.parcel_id);
        setSystems(rec.systems);
        setBriefs(rec.briefs);
      }
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [profile]);

  useEffect(() => {
    if (!session?.user) return;
    fetch('/api/my-homes')
      .then((r) => r.json())
      .then((d) => {
        const ids = new Set<string>((d.homes ?? []).map((h: { parcel_id: string }) => h.parcel_id));
        setSavedParcels(ids);
      })
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    const addr = searchParams.get('address');
    if (addr && !profile && !loading) {
      setInput(addr);
      void lookup(addr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function lookup(addr: string) {
    setLoading(true);
    setError(null);
    setProfile(null);
    try {
      const res = await fetch(`/api/home-profile?address=${encodeURIComponent(addr)}`);
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Lookup failed');
      else setProfile(data.profile);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    await lookup(input.trim());
  }

  async function handleSaveHome() {
    if (!profile) return;
    if (!session?.user) {
      window.location.href = `/account/signup?next=/my-home&parcel=${encodeURIComponent(profile.parcel_id)}`;
      return;
    }
    setSavingHome(true);
    try {
      const res = await fetch('/api/save-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcel_id: profile.parcel_id }),
      });
      if (res.ok) setSavedParcels((prev) => new Set(prev).add(profile.parcel_id));
    } finally {
      setSavingHome(false);
    }
  }

  // Compute derived state for the journey sections.
  const forecasts = useMemo<SystemForecast[]>(
    () => systems.map((s) => forecastSystem(s)),
    [systems]
  );
  const { score, documentation_pct } = useMemo(
    () => computeHealthScore(forecasts, systems.length, ALL_SYSTEM_TYPES.length),
    [forecasts, systems]
  );
  const moneyPlan = useMemo(() => computeMoneyPlan(forecasts), [forecasts]);

  const documentedTypes = useMemo(() => new Set(systems.map((s) => s.system_type)), [systems]);
  const undocumentedTypes = ALL_SYSTEM_TYPES.filter((t) => !documentedTypes.has(t));

  return (
    <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      {/* Address lookup */}
      <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <h1
          className="text-4xl font-bold text-od-navy tracking-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          My home
        </h1>
        <p className="mt-3 text-base text-od-muted">
          Document your home in 30-second snaps. We extract make, model, and age from each
          nameplate, forecast what's due, and price out replacement with rebates baked in.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
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
            {loading ? 'Looking up…' : 'Look up'}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-xl border border-od-red/20 bg-od-red-soft px-4 py-3 text-sm text-od-red">
            {error}
          </div>
        )}
      </div>

      {profile && (
        <>
          <HomeHero
            profile={profile}
            score={score}
            documentationPct={documentation_pct}
            documentedCount={systems.length}
            totalSystems={ALL_SYSTEM_TYPES.length}
            isSaved={savedParcels.has(profile.parcel_id)}
            savingHome={savingHome}
            onSaveHome={handleSaveHome}
            signedIn={!!session?.user}
            firstUndocumentedType={undocumentedTypes[0] ?? null}
          />

          <WhatsNext forecasts={forecasts} profile={profile} undocumentedTypes={undocumentedTypes} />

          <SystemGrid
            forecasts={forecasts}
            systems={systems}
            undocumentedTypes={undocumentedTypes}
            profile={profile}
          />

          <RecentConcerns briefs={briefs} profile={profile} />

          <MoneyPlanSection moneyPlan={moneyPlan} hasData={systems.length > 0} />

          <ActNow profile={profile} forecasts={forecasts} />
        </>
      )}
    </div>
  );
}

// ─── Section 1: Home Hero ────────────────────────────────────────────────────
function HomeHero({
  profile,
  score,
  documentationPct,
  documentedCount,
  totalSystems,
  isSaved,
  savingHome,
  onSaveHome,
  signedIn,
  firstUndocumentedType,
}: {
  profile: HomeProfile;
  score: number;
  documentationPct: number;
  documentedCount: number;
  totalSystems: number;
  isSaved: boolean;
  savingHome: boolean;
  onSaveHome: () => void;
  signedIn: boolean;
  firstUndocumentedType: SystemType | null;
}) {
  const scoreTone = score >= 75 ? 'green' : score >= 50 ? 'orange' : 'red';
  const docHref = firstUndocumentedType
    ? `/my-home/document?parcel_id=${encodeURIComponent(profile.parcel_id)}&system_type=${firstUndocumentedType}&address=${encodeURIComponent(profile.address)}`
    : `/my-home/document?parcel_id=${encodeURIComponent(profile.parcel_id)}&address=${encodeURIComponent(profile.address)}`;

  return (
    <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
            Your home
          </p>
          <h2
            className="mt-1 text-3xl font-bold text-od-navy sm:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {profile.address}
          </h2>
          <p className="mt-1 text-sm text-od-muted">
            ZIP {profile.zip}
            {profile.year_built ? ` · Built ${profile.year_built}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-od-muted">
            Health score
          </p>
          <p
            className={`text-5xl font-bold ${
              scoreTone === 'green' ? 'text-od-green' : scoreTone === 'orange' ? 'text-od-orange' : 'text-od-red'
            }`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {score}
            <span className="text-2xl text-od-muted">/100</span>
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-semibold text-od-navy">
            {documentedCount} of {totalSystems} systems documented
          </span>
          <span className="text-od-muted">{documentationPct}%</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-od-track">
          <div
            className="h-full rounded-full bg-od-primary transition-all"
            style={{ width: `${documentationPct}%` }}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={docHref}
          className="inline-flex items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90"
        >
          {firstUndocumentedType
            ? `Add your ${SYSTEM_LABELS[firstUndocumentedType].toLowerCase()} → +12 pts`
            : 'Add another system'}
        </a>
        {!isSaved && (
          <button
            type="button"
            onClick={onSaveHome}
            disabled={savingHome}
            className="inline-flex items-center justify-center rounded-xl border border-od-navy/15 bg-white px-5 py-2.5 text-sm font-semibold text-od-navy hover:bg-od-primary-soft disabled:opacity-50"
          >
            {savingHome ? 'Saving…' : signedIn ? '★ Save my home' : 'Sign up to save'}
          </button>
        )}
        {isSaved && (
          <span className="inline-flex items-center justify-center rounded-xl border border-od-green/20 bg-od-green-soft px-5 py-2.5 text-sm font-semibold text-od-green">
            ★ Saved to your homes
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Section 2: What's Next timeline ─────────────────────────────────────────
function WhatsNext({
  forecasts,
  profile,
  undocumentedTypes,
}: {
  forecasts: SystemForecast[];
  profile: HomeProfile;
  undocumentedTypes: SystemType[];
}) {
  const grouped: Record<TimelineBucket, SystemForecast[]> = { '30d': [], '6m': [], '1y': [], '5y': [] };
  forecasts.forEach((f) => {
    const b = bucketFor(f);
    if (b) grouped[b].push(f);
  });
  const hasAnyTimeline = TIMELINE_ORDER.some((b) => grouped[b].length > 0);

  return (
    <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
          What's next
        </h3>
        <DemoBadge label="Forecast logic uses static lifespan tables" />
      </div>
      <p
        className="mt-1 text-2xl font-bold text-od-navy sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Your home's next 5 years
      </p>

      {!hasAnyTimeline ? (
        <p className="mt-4 text-sm text-od-muted">
          Document a system to see when it's likely due. We use industry-standard lifespan ranges +
          the install date we extract from the nameplate.
          {undocumentedTypes.length > 0 && (
            <>
              {' '}
              <a
                href={`/my-home/document?parcel_id=${encodeURIComponent(profile.parcel_id)}&system_type=${undocumentedTypes[0]}&address=${encodeURIComponent(profile.address)}`}
                className="font-semibold text-od-navy underline"
              >
                Start with your {SYSTEM_LABELS[undocumentedTypes[0]].toLowerCase()} →
              </a>
            </>
          )}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TIMELINE_ORDER.map((bucket) => (
            <div key={bucket} className="rounded-2xl border border-od-border bg-gray-50/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-od-muted">
                {TIMELINE_LABELS[bucket]}
              </p>
              {grouped[bucket].length === 0 ? (
                <p className="mt-2 text-xs text-od-subtle">—</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {grouped[bucket].map((f) => (
                    <li key={f.system_type} className="text-sm font-semibold text-od-navy">
                      {SYSTEM_LABELS[f.system_type]}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section 3: System health grid ───────────────────────────────────────────
function SystemGrid({
  forecasts,
  systems,
  undocumentedTypes,
  profile,
}: {
  forecasts: SystemForecast[];
  systems: SystemRecord[];
  undocumentedTypes: SystemType[];
  profile: HomeProfile;
}) {
  const forecastByType = new Map(forecasts.map((f) => [f.system_type, f]));
  const recordByType = new Map(systems.map((s) => [s.system_type, s]));

  return (
    <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
        System health
      </h3>
      <p
        className="mt-1 text-2xl font-bold text-od-navy sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Every part of your home
      </p>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ALL_SYSTEM_TYPES.map((type) => {
          const record = recordByType.get(type);
          const forecast = forecastByType.get(type);
          if (!record) {
            return (
              <UndocumentedCard
                key={type}
                type={type}
                profile={profile}
                isNext={undocumentedTypes[0] === type}
              />
            );
          }
          return (
            <DocumentedCard key={type} type={type} record={record} forecast={forecast!} />
          );
        })}
      </div>
    </div>
  );
}

function UndocumentedCard({
  type,
  profile,
  isNext,
}: {
  type: SystemType;
  profile: HomeProfile;
  isNext: boolean;
}) {
  const href = `/my-home/document?parcel_id=${encodeURIComponent(profile.parcel_id)}&system_type=${type}&address=${encodeURIComponent(profile.address)}`;
  return (
    <a
      href={href}
      className={`flex flex-col rounded-2xl border-2 border-dashed p-4 transition-colors ${
        isNext
          ? 'border-od-primary bg-od-primary-soft hover:bg-od-primary/10'
          : 'border-od-border bg-gray-50/70 hover:bg-od-primary-soft'
      }`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-bold text-od-navy">{SYSTEM_LABELS[type]}</h4>
        <span className="inline-flex items-center rounded-full bg-od-track px-2.5 py-0.5 text-xs font-semibold text-od-muted">
          Add photo
        </span>
      </div>
      <p className="mt-2 text-sm text-od-muted">
        Snap the nameplate to unlock age, lifespan, and replacement cost with rebates.
      </p>
      <span className="mt-3 text-sm font-semibold text-od-navy">+12 points →</span>
    </a>
  );
}

function DocumentedCard({
  type,
  record,
  forecast,
}: {
  type: SystemType;
  record: SystemRecord;
  forecast: SystemForecast;
}) {
  const statusStyle = {
    overdue: { label: 'Replace now', chip: 'bg-od-red-soft text-od-red' },
    due_soon: { label: 'Due soon', chip: 'bg-od-red-soft text-od-red' },
    watch: { label: 'Watch', chip: 'bg-od-orange-soft text-od-orange' },
    ok: { label: 'OK', chip: 'bg-od-green-soft text-od-green' },
    unknown: { label: 'Unknown', chip: 'bg-od-track text-od-muted' },
  }[forecast.status];

  return (
    <div className="flex flex-col rounded-2xl border border-od-border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-lg font-bold text-od-navy">{SYSTEM_LABELS[type]}</h4>
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle.chip}`}>
          {statusStyle.label}
        </span>
      </div>
      <p className="mt-2 text-sm text-od-navy">
        {record.make ?? 'Unknown brand'}
        {record.capacity ? ` · ${record.capacity}` : ''}
      </p>
      <p className="mt-1 text-xs text-od-muted">
        {record.estimated_age_years !== null
          ? `~${record.estimated_age_years} years old · ~${forecast.expected_lifespan_years}y lifespan`
          : 'Age unknown'}
      </p>
      {record.recall_or_safety_flag && (
        <p className="mt-2 rounded-md bg-od-red-soft px-2 py-1 text-xs font-semibold text-od-red">
          ⚠ {record.recall_or_safety_flag}
        </p>
      )}
      {forecast.due_window_months !== null && forecast.due_window_months <= 12 && (
        <p className="mt-2 text-xs font-semibold text-od-navy">
          {forecast.upgrade
            ? `Upgrade to ${forecast.upgrade.label.toLowerCase()}: ${formatUSD(forecast.upgrade.net_cost_usd)} net after rebates`
            : `Replacement: ${formatUSD(forecast.like_for_like.net_cost_usd)}`}
        </p>
      )}
    </div>
  );
}

// ─── Section 4: Money Plan ───────────────────────────────────────────────────
function MoneyPlanSection({
  moneyPlan,
  hasData,
}: {
  moneyPlan: ReturnType<typeof computeMoneyPlan>;
  hasData: boolean;
}) {
  return (
    <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
          Money plan
        </h3>
        <DemoBadge label="Static IRA + PG&E + BayREN amounts" />
      </div>
      <p
        className="mt-1 text-2xl font-bold text-od-navy sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        What it'll cost — with rebates
      </p>

      {!hasData ? (
        <p className="mt-4 text-sm text-od-muted">
          Document a system to see replacement forecasts and the rebates you qualify for.
        </p>
      ) : moneyPlan.items.length === 0 ? (
        <p className="mt-4 text-sm text-od-muted">
          Nothing forecast in the next 12 months. Check back as your systems age, or snap more to
          refine the picture.
        </p>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-od-border bg-gray-50/70 p-4">
              <p className="text-xs uppercase text-od-subtle">Sticker price (12 mo)</p>
              <p className="mt-1 text-2xl font-bold text-od-navy">
                {formatUSD(moneyPlan.next_12mo_total_usd)}
              </p>
            </div>
            <div className="rounded-2xl border border-od-green/30 bg-od-green-soft p-4">
              <p className="text-xs uppercase text-od-green">After rebates</p>
              <p className="mt-1 text-2xl font-bold text-od-green">
                {formatUSD(moneyPlan.next_12mo_with_upgrades_usd)}
              </p>
            </div>
            <div className="rounded-2xl border border-od-primary/30 bg-od-primary-soft p-4">
              <p className="text-xs uppercase text-od-primary">Rebates unlocked</p>
              <p className="mt-1 text-2xl font-bold text-od-navy">
                {formatUSD(moneyPlan.total_rebates_unlocked_usd)}
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-3">
            {moneyPlan.items.map((item) => (
              <li
                key={item.system_type}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-od-border bg-white p-4"
              >
                <div>
                  <p className="text-sm font-bold text-od-navy">
                    {SYSTEM_LABELS[item.system_type]}: {item.label}
                  </p>
                  <p className="mt-0.5 text-xs text-od-muted">
                    Due in ~{item.window_months} months · {formatUSD(item.base_cost_usd)} sticker ·
                    {item.rebates_unlocked_usd > 0
                      ? ` ${formatUSD(item.rebates_unlocked_usd)} rebates`
                      : ' No rebates available'}
                  </p>
                </div>
                <p className="text-lg font-bold text-od-green">
                  {formatUSD(item.net_cost_usd)} net
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-od-subtle">
            Rebate eligibility depends on equipment specs, income, and program funding. We show
            typical Bay Area amounts; a contractor confirms your final numbers.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Section 5: Act Now ──────────────────────────────────────────────────────
function ActNow({
  profile,
  forecasts,
}: {
  profile: HomeProfile;
  forecasts: SystemForecast[];
}) {
  const urgent = forecasts.find(
    (f) => f.status === 'overdue' || f.status === 'due_soon'
  );
  const ctaCategory = urgent ? SYSTEM_TO_CATEGORY[urgent.system_type] : 'plumbing_drainage';
  const ctaHref = buildDiagnoseHref(ctaCategory, profile.zip, profile.parcel_id, profile.address);
  const docHref = `/my-home/document?parcel_id=${encodeURIComponent(profile.parcel_id)}&address=${encodeURIComponent(profile.address)}`;

  return (
    <div className="mt-6 mb-10 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
        Act now
      </h3>
      <p
        className="mt-1 text-2xl font-bold text-od-navy sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        What to do today
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <a
          href={ctaHref}
          className="flex flex-col rounded-2xl bg-od-navy p-5 text-white transition-colors hover:bg-od-navy/90"
        >
          <span className="text-xs font-semibold uppercase text-white/70">Top priority</span>
          <span className="mt-1 text-lg font-bold">
            {urgent
              ? `Get quotes for your ${SYSTEM_LABELS[urgent.system_type].toLowerCase()}`
              : 'Get matched with a local pro'}
          </span>
          <span className="mt-auto pt-3 text-sm">3 vetted providers, 24 hr →</span>
        </a>
        <a
          href={docHref}
          className="flex flex-col rounded-2xl border border-od-border bg-white p-5 transition-colors hover:bg-od-primary-soft"
        >
          <span className="text-xs font-semibold uppercase text-od-primary">Document more</span>
          <span className="mt-1 text-lg font-bold text-od-navy">Add another system</span>
          <span className="mt-auto pt-3 text-sm text-od-muted">+12 pts per system →</span>
        </a>
        <a
          href={`/diagnose?parcel_id=${encodeURIComponent(profile.parcel_id)}&address=${encodeURIComponent(profile.address)}`}
          className="flex flex-col rounded-2xl border border-od-border bg-white p-5 transition-colors hover:bg-od-primary-soft"
        >
          <span className="text-xs font-semibold uppercase text-od-primary">Something else?</span>
          <span className="mt-1 text-lg font-bold text-od-navy">Diagnose any problem</span>
          <span className="mt-auto pt-3 text-sm text-od-muted">Photo + AI assessment →</span>
        </a>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
// ─── Recent Concerns (saved briefs) ──────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  plumbing_drainage: 'Plumbing',
  gutters_drainage: 'Gutters',
  landscaping: 'Landscaping',
  roofing: 'Roofing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  pest_control: 'Pest',
  handyman: 'Handyman',
  painting: 'Painting',
};

const SEVERITY_STYLE: Record<DiagnosisBrief['severity'], string> = {
  urgent: 'bg-od-red-soft text-od-red',
  soon: 'bg-od-orange-soft text-od-orange',
  monitor: 'bg-od-green-soft text-od-green',
};

function RecentConcerns({
  briefs,
  profile,
}: {
  briefs: DiagnosisBrief[];
  profile: HomeProfile;
}) {
  if (briefs.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-od-border bg-gray-50/40 p-6 sm:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
          Recent concerns
        </h3>
        <p
          className="mt-1 text-xl font-bold text-od-navy sm:text-2xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Issues you've diagnosed land here
        </p>
        <p className="mt-2 text-sm text-od-muted">
          Diagnose a problem to log it against this home — refer back later, share with a pro, or
          track what you've decided.
        </p>
        <a
          href={`/diagnose?parcel_id=${encodeURIComponent(profile.parcel_id)}&address=${encodeURIComponent(profile.address)}`}
          className="mt-4 inline-flex items-center justify-center rounded-xl border border-od-navy/15 bg-white px-4 py-2 text-sm font-semibold text-od-navy hover:bg-od-primary-soft"
        >
          Start a diagnosis →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
          Recent concerns
        </h3>
        <span className="text-xs text-od-muted">
          {briefs.length} {briefs.length === 1 ? 'brief' : 'briefs'} saved
        </span>
      </div>
      <p
        className="mt-1 text-2xl font-bold text-od-navy sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Issues you've diagnosed
      </p>

      <ul className="mt-5 space-y-3">
        {briefs.map((brief) => {
          const savedDate = new Date(brief.saved_at);
          const reopenHref = `/diagnose?parcel_id=${encodeURIComponent(profile.parcel_id)}&address=${encodeURIComponent(profile.address)}&category=${encodeURIComponent(brief.category)}&neighborhood=${encodeURIComponent(brief.neighborhood)}`;
          return (
            <li
              key={brief.id}
              className="rounded-2xl border border-od-border bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_STYLE[brief.severity]}`}
                  >
                    {brief.severity.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold uppercase text-od-muted">
                    {CATEGORY_LABELS[brief.category] ?? brief.category}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${brief.diyOrPro === 'diy' ? 'bg-od-primary-soft text-od-primary' : 'bg-od-navy/10 text-od-navy'}`}
                  >
                    {brief.diyOrPro === 'diy' ? 'DIY' : 'Pro'}
                  </span>
                </div>
                <span className="text-xs text-od-subtle">
                  {savedDate.toLocaleDateString()}
                </span>
              </div>
              <p className="mt-2 text-base font-bold text-od-navy">{brief.issue}</p>
              <p className="mt-1 line-clamp-2 text-sm text-od-muted">{brief.scopeOfWork}</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-od-muted">
                  Fair range: <span className="font-semibold text-od-navy">{brief.fairPriceRange}</span>
                </span>
                <a
                  href={reopenHref}
                  className="font-semibold text-od-navy underline hover:text-od-primary"
                >
                  Re-open →
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DemoBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-od-primary-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-od-primary"
      title={label}
    >
      Demo data
    </span>
  );
}
