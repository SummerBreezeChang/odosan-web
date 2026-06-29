'use client';

/**
 * Saved-diagnosis detail subpage.
 *
 * Lets the user revisit any saved brief — see the full scope and
 * explanation, change the status, and review BOTH paths (DIY shopping
 * and matched local pros) so an undecided homeowner can come back later
 * and pick a direction. Same slide-up sheet treatment as the seasonal
 * detail pages for visual consistency.
 *
 * Fetches the brief by id from localStorage (or whatever loadHomeRecord
 * returns — falls back to remote if signed in). Products + providers
 * are fetched on mount via the same endpoints the live diagnose result
 * uses, so demo + real flows render the same shape.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Bolt,
  Box,
  CloudRain,
  Droplet,
  Hammer,
  Home,
  Plug,
  ShieldCheck,
  Star,
  Thermometer,
  Wind,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Card, Chip, Label, SectionHeader } from '@/components/brand';
import {
  fetchRemoteRecord,
  loadHomeRecord,
  updateBriefStatus,
  type BriefStatus,
  type DiagnosisBrief,
} from '@/lib/home-record';

const BRIEF_CATEGORY_ICONS: Record<string, LucideIcon> = {
  plumbing_drainage: Droplet,
  gutters_drainage: CloudRain,
  landscaping: Hammer,
  roofing: Home,
  electrical: Bolt,
  hvac: Wind,
  pest_control: Hammer,
  handyman: Hammer,
  painting: Hammer,
  other: Hammer,
};

const BRIEF_CATEGORY_LABELS: Record<string, string> = {
  plumbing_drainage: 'Plumbing',
  gutters_drainage: 'Gutters',
  landscaping: 'Landscaping',
  roofing: 'Roofing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  pest_control: 'Pest',
  handyman: 'Handyman',
  painting: 'Painting',
  other: 'Other',
};

const SEVERITY_TONE: Record<DiagnosisBrief['severity'], 'urgent' | 'soon' | 'good'> = {
  urgent: 'urgent',
  soon: 'soon',
  monitor: 'good',
};

const STATUS_LABEL: Record<BriefStatus, string> = {
  open: 'Open',
  planned: 'Planned',
  fixed: 'Fixed',
};

type AmazonProduct = {
  asin: string;
  title: string;
  url: string;
  image: string | null;
  price: string | null;
  rating: number | null;
};

type CuratedIcon =
  | 'wrench'
  | 'droplet'
  | 'wind'
  | 'plug'
  | 'home'
  | 'thermometer'
  | 'shield'
  | 'box';

type CuratedProduct = {
  id: string;
  title: string;
  description: string;
  priceRange: string;
  searchKeywords: string;
  category: string;
  icon: CuratedIcon;
  url: string | null;
};

type ShoppingBucket = {
  query: string;
  products: AmazonProduct[];
  curatedProducts: CuratedProduct[];
  searchUrl: string | null;
  error: string | null;
};

type Provider = {
  provider_id: string;
  name: string;
  category: string;
  phone: string;
  website?: string;
  google_maps_url?: string;
  rating?: number;
};

const CURATED_ICON_MAP: Record<CuratedIcon, LucideIcon> = {
  wrench: Wrench,
  droplet: Droplet,
  wind: Wind,
  plug: Plug,
  home: Home,
  thermometer: Thermometer,
  shield: ShieldCheck,
  box: Box,
};

const AFFILIATE_PARTNER_TAG = 'summerchang0a-20';

function ensureAffiliateTag(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (!u.searchParams.has('tag')) u.searchParams.set('tag', AFFILIATE_PARTNER_TAG);
    return u.toString();
  } catch {
    return url;
  }
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export default function DiagnosisDetailPage() {
  const params = useParams();
  const briefId = params.briefId as string;

  const [brief, setBrief] = useState<DiagnosisBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopping, setShopping] = useState<ShoppingBucket | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Try localStorage first (works for both anon and signed-in demo
      // accounts since their seed lives locally).
      const local = loadHomeRecord();
      let found = local.briefs.find((b) => b.id === briefId) ?? null;

      // If not found locally, try Aurora (signed-in real users).
      if (!found) {
        const remote = await fetchRemoteRecord();
        if (cancelled) return;
        found = remote?.briefs.find((b) => b.id === briefId) ?? null;
      }

      if (cancelled) return;
      setBrief(found);
      setLoading(false);

      if (!found) return;

      // Parallel-fetch DIY products + matched providers.
      const productsPromise =
        found.diyShoppingQuery && found.diyShoppingQuery.trim()
          ? fetch('/api/amazon-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keywords: found.diyShoppingQuery }),
            })
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => (data?.single as ShoppingBucket) ?? null)
              .catch(() => null)
          : Promise.resolve(null);

      const providersPromise = fetch(
        `/api/providers?category=${found.category}&neighborhood=${encodeURIComponent(
          found.neighborhood
        )}`
      )
        .then((r) => (r.ok ? r.json() : { providers: [] }))
        .then((data) => (data.providers as Provider[]) ?? [])
        .catch(() => [] as Provider[]);

      const [productsResult, providersResult] = await Promise.all([
        productsPromise,
        providersPromise,
      ]);
      if (cancelled) return;
      setShopping(productsResult);
      setProviders(providersResult);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [briefId]);

  function handleStatusChange(next: BriefStatus) {
    if (!brief || statusUpdating) return;
    setStatusUpdating(true);
    const updated = updateBriefStatus(brief.id, next);
    if (updated) setBrief(updated);
    setStatusUpdating(false);
  }

  if (loading) {
    return (
      <div className="seasonal-shell pb-12">
        <div className="mx-auto w-full max-w-xl rounded-t-[28px] bg-white px-5 pt-4 sm:px-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="flex justify-end">
            <Link
              href="/my-home"
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-od-border bg-white text-od-muted"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
          <p className="mt-12 text-center text-[14px] text-od-muted">Loading…</p>
        </div>
      </div>
    );
  }

  if (!brief) {
    return (
      <div className="seasonal-shell pb-12">
        <div className="mx-auto w-full max-w-xl rounded-t-[28px] bg-white px-5 pt-4 sm:px-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
          <div className="flex justify-end">
            <Link
              href="/my-home"
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-od-border bg-white text-od-muted"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-12 text-center">
            <p className="text-[18px] font-semibold text-od-navy" style={{ fontFamily: 'var(--font-display)' }}>
              Diagnosis not found
            </p>
            <p className="mt-2 text-[14px] text-od-muted">
              It may have been removed, or it lives on a different device.
            </p>
            <Link
              href="/my-home"
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white hover:bg-od-navy/90"
            >
              Back to My home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const Icon = BRIEF_CATEGORY_ICONS[brief.category] ?? Hammer;
  const categoryLabel = BRIEF_CATEGORY_LABELS[brief.category] ?? brief.category;
  const status: BriefStatus = brief.status ?? 'open';
  const daysToFix =
    status === 'fixed' && brief.fixed_at ? daysBetween(brief.saved_at, brief.fixed_at) : null;
  const dateLabel =
    status === 'fixed' && brief.fixed_at
      ? `Fixed ${shortDate(brief.fixed_at)}${daysToFix !== null ? ` · ${daysToFix}d` : ''}`
      : `Saved ${shortDate(brief.saved_at)}`;
  const dateTone = status === 'fixed' ? 'text-od-green' : 'text-od-subtle';

  const hasRealProducts = (shopping?.products.length ?? 0) > 0;
  const hasCurated = (shopping?.curatedProducts.length ?? 0) > 0;
  const showProducts = hasRealProducts || hasCurated;

  return (
    <div className="seasonal-shell pb-12">
      <style>{`
        @keyframes seasonal-slide-up {
          from { opacity: 0; transform: translateY(80px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .seasonal-sheet {
          animation: seasonal-slide-up 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .seasonal-sheet { animation: none; }
        }
      `}</style>

      <div
        className="seasonal-sheet mx-auto w-full max-w-xl rounded-t-[28px] bg-white px-5 pt-4 shadow-[0_-14px_36px_rgba(27,56,42,0.12)] sm:px-6"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        {/* Close — top right */}
        <div className="flex justify-end">
          <Link
            href="/my-home"
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-od-border bg-white text-od-muted transition-colors hover:bg-od-cream hover:text-od-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Link>
        </div>

        {/* Hero */}
        <div className="mt-5 flex gap-4">
          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-od-primary-soft text-od-primary"
          >
            <Icon className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={SEVERITY_TONE[brief.severity]}>{brief.severity}</Chip>
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-od-muted">
                {categoryLabel}
              </span>
              <span className={`ml-auto whitespace-nowrap text-[11px] font-medium ${dateTone}`}>
                {dateLabel}
              </span>
            </div>
            <h1
              className="mt-2 text-[24px] font-semibold leading-[1.2] text-od-ink"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {brief.issue}
            </h1>
          </div>
        </div>

        {/* Fair price */}
        <Card className="mt-5">
          <Label>Fair price range</Label>
          <p
            className="mt-1 text-[26px] font-semibold leading-[1.15] text-od-ink"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {brief.fairPriceRange}
          </p>
          {brief.explanation && (
            <p className="mt-2 text-[14px] leading-[1.55] text-od-body">{brief.explanation}</p>
          )}
        </Card>

        {/* Scope */}
        <Card className="mt-3">
          <Label>Scope of work</Label>
          <p className="mt-1 text-[14px] leading-[1.5] text-od-body">{brief.scopeOfWork}</p>
        </Card>

        {/* Status toggle */}
        <div className="mt-5">
          <Label>Status</Label>
          <div
            className="mt-2 inline-flex overflow-hidden rounded-full border border-od-border bg-white text-[13px] font-semibold"
            role="group"
            aria-label="Update status"
          >
            {(['open', 'planned', 'fixed'] as const).map((s, i) => {
              const active = s === status;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  disabled={statusUpdating}
                  aria-pressed={active}
                  className={`px-4 py-2 transition-colors ${i > 0 ? 'border-l border-od-border' : ''} ${
                    active ? 'bg-od-ink text-od-bg' : 'bg-white text-od-navy hover:bg-od-cream'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fix it yourself — DIY products */}
        <SectionHeader title="Fix it yourself" size="h2" className="mt-8 mb-3" />
        {showProducts ? (
          <div className="space-y-2">
            {(hasRealProducts ? shopping!.products.slice(0, 3) : []).map((p, i) => (
              <a
                key={p.asin}
                href={ensureAffiliateTag(p.url) ?? '#'}
                target="_blank"
                rel="sponsored nofollow noopener"
                className="flex items-center gap-3 rounded-[14px] border border-od-border bg-white p-3 transition-shadow hover:shadow-[0_4px_12px_rgba(27,56,42,0.06)]"
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-16 w-16 shrink-0 rounded-[10px] bg-white object-contain p-1" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-od-primary-soft">
                    <Box className="h-5 w-5 text-od-primary" aria-hidden="true" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {i === 0 && (
                    <span className="mb-1 inline-block rounded-full bg-od-ink px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Top pick
                    </span>
                  )}
                  <p className="line-clamp-2 text-[13px] font-medium leading-tight text-od-ink">{p.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-od-ink">{p.price ?? '—'}</span>
                    {typeof p.rating === 'number' && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-od-orange">
                        <Star className="h-3 w-3 fill-current" aria-hidden="true" /> {p.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))}
            {!hasRealProducts &&
              shopping!.curatedProducts.map((p, i) => {
                const Icon2 = CURATED_ICON_MAP[p.icon] ?? Box;
                return (
                  <a
                    key={p.id}
                    href={ensureAffiliateTag(p.url ?? shopping!.searchUrl) ?? '#'}
                    target="_blank"
                    rel="sponsored nofollow noopener"
                    className="flex items-center gap-3 rounded-[14px] border border-od-border bg-white p-3 transition-shadow hover:shadow-[0_4px_12px_rgba(27,56,42,0.06)]"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] bg-od-primary-soft">
                      <Icon2 className="h-6 w-6 text-od-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {i === 0 && (
                        <span className="mb-1 inline-block rounded-full bg-od-ink px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Top pick
                        </span>
                      )}
                      <p className="line-clamp-2 text-[13px] font-medium leading-tight text-od-ink">{p.title}</p>
                      <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-od-muted">{p.description}</p>
                      <p className="mt-1 text-[14px] font-semibold text-od-ink">{p.priceRange}</p>
                    </div>
                  </a>
                );
              })}
            <p className="pt-2 text-[11px] text-od-subtle">
              As an Amazon Associate, Odosan earns from qualifying purchases.
            </p>
          </div>
        ) : (
          <a
            href={ensureAffiliateTag(shopping?.searchUrl) ?? '#'}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="block rounded-[14px] border border-od-border bg-white px-4 py-3 text-[14px] font-semibold text-od-ink hover:shadow-[0_4px_12px_rgba(27,56,42,0.06)]"
          >
            Find on Amazon →
          </a>
        )}

        {/* Hire a pro — matched providers */}
        <SectionHeader title="Hire a pro" size="h2" className="mt-8 mb-3" />
        {providers.length === 0 ? (
          <p className="rounded-[14px] border border-od-border bg-white px-4 py-3 text-[13px] text-od-muted">
            No vetted pros currently matched for {categoryLabel.toLowerCase()} in {brief.neighborhood}.
          </p>
        ) : (
          <ul className="space-y-2">
            {providers.slice(0, 3).map((p) => (
              <li
                key={p.provider_id}
                className="rounded-[14px] border border-od-border bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-od-ink">{p.name}</p>
                    <p className="mt-0.5 text-[11px] text-od-muted">
                      {categoryLabel}
                      {p.rating ? ` · ★ ${p.rating}` : ''}
                    </p>
                  </div>
                  {p.google_maps_url && (
                    <a
                      href={p.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[12px] font-semibold text-od-leaf hover:text-od-ink"
                    >
                      Maps →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
