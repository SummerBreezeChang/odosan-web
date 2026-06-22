'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveSystem, syncSystemToServer, type SystemType as RecordSystemType } from '@/lib/home-record';

type SystemType = RecordSystemType;

type Extracted = {
  system_type: SystemType;
  make: string | null;
  model: string | null;
  serial: string | null;
  install_date: string | null;
  manufacture_date: string | null;
  capacity: string | null;
  fuel_or_type: string | null;
  estimated_age_years: number | null;
  expected_lifespan_years: number | null;
  notes: string | null;
  recall_or_safety_flag: string | null;
  confidence: number;
  raw_text: string;
};

type AmazonProduct = {
  asin: string;
  title: string;
  url: string;
  image: string | null;
  price: string | null;
  priceAmount: number | null;
  rating: number | null;
  reviewCount: number | null;
};

type Bucket = {
  query: string;
  products: AmazonProduct[];
  searchUrl: string | null;
  error: string | null;
} | null;

type ShoppingResult = { extend: Bucket; replace: Bucket } | null;

const SYSTEM_OPTIONS: Array<{ value: SystemType; label: string; hint: string }> = [
  {
    value: 'water_heater',
    label: 'Water heater',
    hint: 'Snap the silver/white nameplate sticker. Brand, model, capacity.',
  },
  {
    value: 'hvac',
    label: 'HVAC / furnace',
    hint: 'Outdoor condenser or indoor furnace nameplate. Tonnage + serial.',
  },
  {
    value: 'electrical_panel',
    label: 'Electrical panel',
    hint: 'Inside the breaker box cover. Brand + main breaker amperage.',
  },
  {
    value: 'roof_invoice',
    label: 'Roof invoice / receipt',
    hint: 'A past roofing invoice or work order — PDF screenshot or photo.',
  },
];

export default function DocumentSpikePage() {
  return (
    <Suspense fallback={null}>
      <DocumentSpike />
    </Suspense>
  );
}

function DocumentSpike() {
  const searchParams = useSearchParams();
  const initialSystemType = (searchParams.get('system_type') as SystemType) || 'water_heater';

  const [systemType, setSystemType] = useState<SystemType>(initialSystemType);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shopping, setShopping] = useState<ShoppingResult>(null);
  const [shoppingLoading, setShoppingLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = searchParams.get('system_type') as SystemType | null;
    if (t && t !== systemType) setSystemType(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function onFile(f: File | null) {
    setError(null);
    setExtracted(null);
    setShopping(null);
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  async function extract() {
    if (!file) return;
    setExtracting(true);
    setError(null);
    setExtracted(null);
    setShopping(null);
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append('system_type', systemType);
      fd.append('photo', file);
      const res = await fetch('/api/nameplate-extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Extraction failed');
        return;
      }
      setExtracted(data.extracted);
      try {
        const { system_type, make, model, serial, install_date, manufacture_date, capacity, fuel_or_type, estimated_age_years, expected_lifespan_years, notes, recall_or_safety_flag, confidence, raw_text } = data.extracted;
        const systemPayload = {
          system_type,
          make,
          model,
          serial,
          install_date,
          manufacture_date,
          capacity,
          fuel_or_type,
          estimated_age_years,
          expected_lifespan_years,
          notes,
          recall_or_safety_flag,
          confidence,
          raw_text,
        };
        saveSystem(systemPayload);
        // Fire-and-forget DB sync (with S3 photo metadata when present).
        // 401 means anonymous user — fine, the system lives in localStorage.
        void syncSystemToServer({
          ...systemPayload,
          photo_s3_bucket: data.photo?.bucket ?? null,
          photo_s3_key: data.photo?.key ?? null,
          photo_s3_region: data.photo?.region ?? null,
        });
        setSaved(true);
      } catch (err) {
        console.error('saveSystem failed', err);
      }
      fetchShopping(data.extracted);
    } catch {
      setError('Network error.');
    } finally {
      setExtracting(false);
    }
  }

  async function fetchShopping(ex: Extracted) {
    setShoppingLoading(true);
    try {
      const res = await fetch('/api/amazon-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted: ex }),
      });
      const data = await res.json();
      if (res.ok) setShopping(data);
    } catch {
      // Non-fatal — extraction still works without shopping.
    } finally {
      setShoppingLoading(false);
    }
  }

  const activeOption = SYSTEM_OPTIONS.find((o) => o.value === systemType)!;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
          Scan a system
        </p>
        <h1
          className="mt-2 text-3xl font-bold text-od-navy tracking-tight sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Snap a nameplate
        </h1>
        <p className="mt-3 text-sm text-od-muted">
          Upload a photo of a water heater, HVAC, or electrical panel nameplate — or a past
          roofing invoice. We extract the make, model, and install date so you know where each
          system stands.
        </p>

        {saved && (
          <div className="mt-4 rounded-xl border border-od-green/20 bg-od-green-soft px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm font-semibold text-od-green">
              ✓ Saved to your home record.
            </p>
            <a
              href="/my-home"
              className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white hover:bg-od-navy/90 sm:mt-0 sm:w-auto"
            >
              Back to My home →
            </a>
          </div>
        )}

        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-wide text-od-muted">
            System type
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SYSTEM_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSystemType(opt.value)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  systemType === opt.value
                    ? 'border-od-navy bg-od-navy text-white'
                    : 'border-od-border bg-white text-od-navy hover:border-od-primary'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-od-subtle">{activeOption.hint}</p>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="mt-6 rounded-2xl border-2 border-dashed border-od-border bg-gray-50/70 p-6 text-center"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="preview"
              className="mx-auto max-h-80 rounded-lg object-contain"
            />
          ) : (
            <div className="py-8 text-sm text-od-muted">
              Drag a photo here, or click to pick a file
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-od-border bg-white px-4 py-2 text-sm font-semibold text-od-navy hover:bg-od-primary-soft"
            >
              {file ? 'Replace photo' : 'Choose photo'}
            </button>
            <button
              type="button"
              onClick={extract}
              disabled={!file || extracting}
              className="rounded-xl bg-od-navy px-5 py-2 text-sm font-semibold text-white hover:bg-od-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {extracting ? 'Extracting…' : 'Scan nameplate'}
            </button>
          </div>
          {file && (
            <p className="mt-2 text-xs text-od-subtle">
              {file.name} · {(file.size / 1024).toFixed(0)} KB · {file.type || 'unknown type'}
            </p>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-od-red/20 bg-od-red-soft px-4 py-3 text-sm text-od-red">
            {error}
          </div>
        )}
      </div>

      {extracted && (
        <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2
              className="text-2xl font-bold text-od-navy sm:text-3xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Extracted fields
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                extracted.confidence >= 75
                  ? 'bg-od-green-soft text-od-green'
                  : extracted.confidence >= 45
                  ? 'bg-od-orange-soft text-od-orange'
                  : 'bg-od-red-soft text-od-red'
              }`}
            >
              Confidence {extracted.confidence}%
            </span>
          </div>

          {extracted.recall_or_safety_flag && (
            <div className="mt-4 rounded-xl border border-od-red/30 bg-od-red-soft px-4 py-3 text-sm text-od-red">
              <span className="font-semibold">⚠ Safety flag:</span>{' '}
              {extracted.recall_or_safety_flag}
            </div>
          )}

          <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Field label="Make" value={extracted.make} />
            <Field label="Model" value={extracted.model} />
            <Field label="Serial" value={extracted.serial} />
            <Field label="Capacity" value={extracted.capacity} />
            <Field label="Fuel / type" value={extracted.fuel_or_type} />
            <Field label="Manufacture date" value={extracted.manufacture_date} />
            <Field label="Install date" value={extracted.install_date} />
            <Field
              label="Estimated age"
              value={
                extracted.estimated_age_years !== null
                  ? `${extracted.estimated_age_years} years`
                  : null
              }
            />
            <Field
              label="Expected lifespan"
              value={
                extracted.expected_lifespan_years !== null
                  ? `${extracted.expected_lifespan_years} years`
                  : null
              }
            />
          </dl>

          {extracted.notes && (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-od-muted">
                Notes
              </p>
              <p className="mt-1 text-sm text-od-navy">{extracted.notes}</p>
            </div>
          )}

          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-od-muted">
              Raw text read from image
            </p>
            <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-od-border bg-gray-50 p-3 text-xs text-od-navy">
              {extracted.raw_text || '(empty)'}
            </pre>
          </div>

          <details className="mt-5">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-od-muted">
              Full JSON
            </summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded-xl border border-od-border bg-gray-50 p-3 text-xs text-od-navy">
              {JSON.stringify(extracted, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {extracted && (
        <ShoppingPanel
          loading={shoppingLoading}
          shopping={shopping}
          systemType={extracted.system_type}
        />
      )}
    </div>
  );
}

function ShoppingPanel({
  loading,
  shopping,
  systemType,
}: {
  loading: boolean;
  shopping: ShoppingResult;
  systemType: SystemType;
}) {
  if (loading) {
    return (
      <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 text-sm text-od-muted shadow-sm sm:p-10">
        Loading shopping options…
      </div>
    );
  }
  if (!shopping) return null;
  const hasAny =
    (shopping.extend?.products.length ?? 0) > 0 ||
    (shopping.replace?.products.length ?? 0) > 0 ||
    !!shopping.extend?.searchUrl ||
    !!shopping.replace?.searchUrl;
  if (!hasAny && !shopping.extend?.error && !shopping.replace?.error) return null;

  return (
    <div className="mt-6 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">
        Shopping options
      </p>
      <h2
        className="mt-2 text-2xl font-bold text-od-navy sm:text-3xl"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        What to do about it
      </h2>

      {shopping.extend && (
        <Bucket
          title="Extend its life"
          subtitle="DIY parts you can install in under an hour."
          bucket={shopping.extend}
        />
      )}

      {shopping.replace && systemType !== 'roof_invoice' && (
        <div className="mt-8">
          <div className="rounded-2xl border border-od-primary/15 bg-od-primary-soft p-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-semibold text-od-navy">
                Time to replace? Get a full-service quote first.
              </p>
              <p className="mt-1 text-sm text-od-muted">
                Most homeowners spend more on install than the unit itself. A vetted local pro quotes
                unit + install + haul-away as one number.
              </p>
            </div>
            <a
              href="/diagnose"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90 sm:mt-0 sm:w-auto"
            >
              Get matched →
            </a>
          </div>
          <Bucket
            title="Or buy the unit yourself (price reference)"
            subtitle="If you have your own installer or want to compare prices."
            bucket={shopping.replace}
            compact
          />
        </div>
      )}

      <p className="mt-8 border-t border-od-border pt-4 text-xs text-od-subtle">
        As an Amazon Associate, Odosan earns from qualifying purchases. Prices and availability are
        accurate as of the time shown and may change.
      </p>
    </div>
  );
}

function Bucket({
  title,
  subtitle,
  bucket,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  bucket: {
    query: string;
    products: AmazonProduct[];
    searchUrl: string | null;
    error: string | null;
  };
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'mt-4' : 'mt-6'}>
      <h3 className="text-base font-bold text-od-navy">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-od-muted">{subtitle}</p>}
      <p className="mt-0.5 text-[11px] text-od-subtle">Search: “{bucket.query}”</p>

      {bucket.error && (
        <div className="mt-3 rounded-xl border border-od-red/20 bg-od-red-soft px-3 py-2 text-xs text-od-red">
          Amazon error: {bucket.error}
        </div>
      )}

      {bucket.products.length === 0 && !bucket.error && bucket.searchUrl && (
        <a
          href={bucket.searchUrl}
          target="_blank"
          rel="noopener nofollow sponsored"
          className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-od-border bg-white px-4 py-3 transition-colors hover:border-od-primary"
        >
          <p className="text-sm font-semibold text-od-navy">🛒 Find on Amazon</p>
          <span aria-hidden className="text-od-primary">→</span>
        </a>
      )}

      {bucket.products.length === 0 && !bucket.error && !bucket.searchUrl && (
        <p className="mt-3 text-xs text-od-subtle">No products returned.</p>
      )}

      {bucket.products.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bucket.products.map((p) => (
            <a
              key={p.asin}
              href={p.url}
              target="_blank"
              rel="noopener nofollow sponsored"
              className="flex flex-col rounded-2xl border border-od-border bg-white p-3 transition-colors hover:border-od-primary"
            >
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.image}
                  alt=""
                  className="mx-auto h-32 object-contain"
                  loading="lazy"
                />
              )}
              <p className="mt-2 line-clamp-3 text-sm font-semibold text-od-navy">{p.title}</p>
              <div className="mt-auto flex items-baseline justify-between pt-2">
                <span className="text-base font-bold text-od-navy">{p.price ?? '—'}</span>
                {p.rating !== null && (
                  <span className="text-xs text-od-muted">
                    ★ {p.rating.toFixed(1)}
                    {p.reviewCount ? ` (${p.reviewCount.toLocaleString()})` : ''}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-od-muted">{label}</dt>
      <dd className={`mt-0.5 text-sm ${value ? 'text-od-navy' : 'text-od-subtle italic'}`}>
        {value ?? 'not detected'}
      </dd>
    </div>
  );
}
