'use client';

import { useEffect, useState } from 'react';
import {
  Bolt,
  Bug,
  CloudRain,
  Droplet,
  Hammer,
  Home,
  Paintbrush,
  Trees,
  Wind,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import {
  SYSTEM_LABELS,
  fetchRemoteRecord,
  loadHomeRecord,
  migrateLocalToRemote,
  type DiagnosisBrief,
  type SystemRecord,
  type SystemType,
} from '@/lib/home-record';

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

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  plumbing_drainage: Droplet,
  gutters_drainage: CloudRain,
  landscaping: Trees,
  roofing: Home,
  electrical: Bolt,
  hvac: Wind,
  pest_control: Bug,
  handyman: Wrench,
  painting: Paintbrush,
};

const SYSTEM_ICONS: Record<SystemType, LucideIcon> = {
  water_heater: Droplet,
  hvac: Wind,
  electrical_panel: Bolt,
  roof_invoice: Home,
};

const SEVERITY_STYLE: Record<DiagnosisBrief['severity'], string> = {
  urgent: 'bg-od-red-soft text-od-red',
  soon: 'bg-od-orange-soft text-od-orange',
  monitor: 'bg-od-green-soft text-od-green',
};

export default function MyHomePage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [systems, setSystems] = useState<SystemRecord[]>([]);
  const [briefs, setBriefs] = useState<DiagnosisBrief[]>([]);
  const [migrationStatus, setMigrationStatus] = useState<
    'idle' | 'migrating' | 'done' | 'failed'
  >('idle');

  // Refresh from whichever store is active for the current user.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      if (session?.user) {
        // Signed in — pull from Aurora. If a localStorage record exists, migrate
        // it first on the very first load after sign-in, then re-fetch.
        const local = loadHomeRecord();
        const hasLocal = local.briefs.length > 0 || local.systems.length > 0;
        if (hasLocal && migrationStatus === 'idle') {
          setMigrationStatus('migrating');
          const result = await migrateLocalToRemote();
          if (cancelled) return;
          // CRITICAL: only clear localStorage when the server confirmed it
          // saved the rows. If migration failed (DB tables missing, network
          // error, anything), keep local data intact so the user doesn't
          // lose their record — they'll see it on next visit too.
          if (result !== null) {
            try {
              window.localStorage.removeItem('odosan:home-record');
            } catch {}
            setMigrationStatus('done');
          } else {
            setMigrationStatus('failed');
          }
        }
        const remote = await fetchRemoteRecord();
        if (cancelled) return;
        if (remote) {
          // If the server has data, show it. If the server has nothing but
          // local still does (because migration failed), show the local data
          // as a fallback — user's record is never invisible.
          if (remote.briefs.length === 0 && remote.systems.length === 0) {
            const local = loadHomeRecord();
            setSystems(local.systems);
            setBriefs(local.briefs);
          } else {
            setSystems(remote.systems);
            setBriefs(remote.briefs);
          }
        } else {
          // Remote fetch failed entirely — fall back to localStorage.
          const local = loadHomeRecord();
          setSystems(local.systems);
          setBriefs(local.briefs);
        }
      } else {
        const rec = loadHomeRecord();
        if (cancelled) return;
        setSystems(rec.systems);
        setBriefs(rec.briefs);
      }
    }
    void refresh();
    function onFocus() {
      void refresh();
    }
    window.addEventListener('focus', onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const isSignedIn = !!session?.user;
  const hasAnyData = briefs.length > 0 || systems.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
      <header>
        <h1
          className="text-4xl font-bold text-od-navy tracking-tight sm:text-5xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          My home
        </h1>
        <p className="mt-3 text-base text-od-muted">
          {isSignedIn ? (
            <>
              Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}. Your
              maintenance record, saved to your account.
            </>
          ) : (
            <>A lightweight record of your home&apos;s health. It grows every time you diagnose something.</>
          )}
        </p>
      </header>

      {!sessionLoading && !isSignedIn && hasAnyData && (
        <div className="mt-6 rounded-2xl border border-od-primary/20 bg-od-primary-soft p-4 sm:p-5">
          <p className="text-sm font-semibold text-od-navy">
            ✨ Save this across devices
          </p>
          <p className="mt-1 text-sm text-od-muted">
            Right now your record is on this browser only. Create a free account to keep it safe
            — open it from your phone, share it with a pro, take it with you.
          </p>
          <a
            href="/account/signup?next=/my-home"
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90"
          >
            Create a free account →
          </a>
        </div>
      )}

      {migrationStatus === 'done' && hasAnyData && (
        <div className="mt-4 rounded-xl border border-od-green/20 bg-od-green-soft px-4 py-2 text-xs text-od-green">
          ✓ Your previous record has been moved to your account.
        </div>
      )}

      {migrationStatus === 'failed' && (
        <div className="mt-4 rounded-xl border border-od-orange/20 bg-od-orange-soft px-4 py-3 text-xs text-od-orange">
          <p className="font-semibold">
            ⚠ Couldn&apos;t sync your record to your account yet.
          </p>
          <p className="mt-1">
            Your data is still safe in this browser — nothing was lost. Try
            refreshing in a moment. If the issue persists, contact{' '}
            <a href="mailto:contact@odosan.tech" className="underline">
              contact@odosan.tech
            </a>
            .
          </p>
        </div>
      )}

      <SeasonalCard />

      <HomeDocumentsCard />

      <section className="mt-8">
        <h2 className="text-lg font-bold text-od-navy">Saved diagnoses</h2>
        {briefs.length === 0 ? (
          <EmptyCard
            heading="Nothing saved yet"
            body="Diagnose your first problem and tap ‘Save to My home’ to start a record."
            cta={{ href: '/diagnose', label: 'Diagnose a problem' }}
          />
        ) : (
          <ul className="mt-3 space-y-3">
            {briefs.map((brief) => (
              <BriefCard key={brief.id} brief={brief} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-od-navy">Scanned systems</h2>
        {systems.length === 0 ? (
          <EmptyCard
            heading="No systems scanned yet"
            body="When you DIY, scanning your water heater, HVAC, or panel adds it here."
            cta={{ href: '/my-home/document', label: 'Scan a system' }}
          />
        ) : (
          <ul className="mt-3 space-y-3">
            {systems.map((system) => (
              <SystemCard key={system.id} system={system} />
            ))}
          </ul>
        )}
      </section>

      <aside className="mt-10 rounded-2xl border border-od-border bg-od-cream p-4 sm:p-5">
        <div className="flex gap-3">
          <span aria-hidden className="text-od-primary">✦</span>
          <p className="text-sm text-od-navy">
            <span className="font-semibold">Coming soon.</span> A transferable Home Health
            Scorecard at resale — proof you&apos;ve taken care of the place.
          </p>
        </div>
      </aside>
    </div>
  );
}

function EmptyCard({
  heading,
  body,
  cta,
}: {
  heading: string;
  body: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="mt-3 rounded-2xl border border-od-border bg-white/60 p-6 text-center shadow-[0_1px_2px_rgba(27,56,42,0.05)] sm:p-8">
      <p className="text-base font-semibold text-od-navy">{heading}</p>
      <p className="mt-2 text-sm text-od-muted">{body}</p>
      <a
        href={cta.href}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90"
      >
        {cta.label}
      </a>
    </div>
  );
}

function BriefCard({ brief }: { brief: DiagnosisBrief }) {
  const savedDate = new Date(brief.saved_at);
  const Icon = CATEGORY_ICONS[brief.category] ?? Wrench;
  return (
    <li className="flex gap-3 rounded-2xl border border-od-border bg-white/60 p-4 shadow-[0_1px_2px_rgba(27,56,42,0.05)]">
      <div
        aria-hidden
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-od-primary-soft text-od-primary"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
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
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              brief.diyOrPro === 'diy'
                ? 'bg-od-primary-soft text-od-primary'
                : 'bg-od-navy/10 text-od-navy'
            }`}
          >
            {brief.diyOrPro === 'diy' ? 'DIY' : 'Pro'}
          </span>
          <span className="ml-auto text-xs text-od-subtle">{savedDate.toLocaleDateString()}</span>
        </div>
        <p className="mt-2 text-base font-bold text-od-navy">{brief.issue}</p>
        <p className="mt-1 line-clamp-2 text-sm text-od-muted">{brief.scopeOfWork}</p>
        <p className="mt-2 text-xs text-od-muted">
          Fair range: <span className="font-semibold text-od-navy">{brief.fairPriceRange}</span>
        </p>
      </div>
    </li>
  );
}

function SystemCard({ system }: { system: SystemRecord }) {
  const Icon = SYSTEM_ICONS[system.system_type] ?? Hammer;
  return (
    <li className="flex gap-3 rounded-2xl border border-od-border bg-white/60 p-4 shadow-[0_1px_2px_rgba(27,56,42,0.05)]">
      <div
        aria-hidden
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-od-primary-soft text-od-primary"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-base font-bold text-od-navy">{SYSTEM_LABELS[system.system_type]}</p>
          <span className="text-xs text-od-subtle">
            Scanned {new Date(system.documented_at).toLocaleDateString()}
          </span>
        </div>
        <p className="mt-1 text-sm text-od-navy">
          {system.make ?? 'Unknown brand'}
          {system.capacity ? ` · ${system.capacity}` : ''}
        </p>
        {system.estimated_age_years !== null && (
          <p className="mt-1 text-xs text-od-muted">
            ~{system.estimated_age_years} years old
            {system.expected_lifespan_years
              ? ` · ~${system.expected_lifespan_years}y typical lifespan`
              : ''}
          </p>
        )}
        {system.recall_or_safety_flag && (
          <p className="mt-2 rounded-md bg-od-red-soft px-2 py-1 text-xs font-semibold text-od-red">
            ⚠ {system.recall_or_safety_flag}
          </p>
        )}
      </div>
    </li>
  );
}

// ─── Seasonal maintenance card ──────────────────────────────────────────
// Static top-5 list. Each item deep-links to /diagnose with category
// pre-filled so a tap → photo → AI plan flow is one tap away.

type SeasonalTask = {
  id: string;
  title: string;
  when: string;
  why: string;
  category: string;
  icon: LucideIcon;
};

const SEASONAL_TASKS: SeasonalTask[] = [
  {
    id: 'gutter-clean',
    title: 'Gutter cleaning',
    when: 'Before fall rains',
    why: 'Clogged gutters back water up at the foundation — the #1 cause of basement leaks.',
    category: 'gutters_drainage',
    icon: CloudRain,
  },
  {
    id: 'hvac-filter',
    title: 'HVAC filter swap',
    when: 'Quarterly · before heating season',
    why: 'A clogged filter cuts efficiency ~15% and shortens the unit’s life.',
    category: 'hvac',
    icon: Wind,
  },
  {
    id: 'water-heater-flush',
    title: 'Water heater flush',
    when: 'Annual',
    why: 'Sediment hardens at the bottom, kills capacity, and rumbles when the burner fires.',
    category: 'plumbing_drainage',
    icon: Droplet,
  },
  {
    id: 'roof-check',
    title: 'Roof inspection',
    when: 'Annual · before rainy season',
    why: 'Catch a slipped shingle or cracked flashing before a leak finds your ceiling.',
    category: 'roofing',
    icon: Home,
  },
  {
    id: 'sump-pump',
    title: 'Sump pump test',
    when: 'Before rainy season',
    why: 'Pour a bucket in. If it doesn’t pump out, you find out now — not at 3 a.m.',
    category: 'plumbing_drainage',
    icon: Droplet,
  },
];

function SeasonalCard() {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-od-navy">Seasonal maintenance</h2>
      <p className="mt-1 text-sm text-od-muted">
        Top 5 things first-time homeowners forget. Tap any to diagnose with a photo.
      </p>
      <ul className="mt-3 space-y-3">
        {SEASONAL_TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <li
              key={task.id}
              className="flex gap-3 rounded-2xl border border-od-border bg-white/60 p-4 shadow-[0_1px_2px_rgba(27,56,42,0.05)]"
            >
              <div
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-od-primary-soft text-od-primary"
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-base font-bold text-od-navy">{task.title}</p>
                  <span className="text-xs text-od-subtle">{task.when}</span>
                </div>
                <p className="mt-1 text-sm text-od-muted">{task.why}</p>
                <a
                  href={`/diagnose?category=${task.category}`}
                  className="mt-2 inline-flex items-center text-sm font-semibold text-od-primary hover:text-od-leaf"
                >
                  Diagnose with a photo →
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Home documents (photo upload) ──────────────────────────────────────
// Uploads to S3 via /api/home-documents. Thumbnail is generated client-side
// (resized data URL) and stored in localStorage alongside the S3 key, so
// thumbs survive reload even though the S3 bucket is private.

type HomeDocument = {
  id: string;
  key: string;
  bucket: string;
  filename: string;
  contentType: string;
  thumbnail: string; // resized data URL, ~256px
  uploadedAt: string;
};

const DOCUMENTS_STORAGE_KEY = 'odosan:home-documents';

function loadDocuments(): HomeDocument[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(DOCUMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDocuments(docs: HomeDocument[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DOCUMENTS_STORAGE_KEY, JSON.stringify(docs));
  } catch {}
}

async function generateThumbnail(file: File, maxDim = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = () => {
      const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function HomeDocumentsCard() {
  const [docs, setDocs] = useState<HomeDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDocs(loadDocuments());
  }, []);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const newDocs: HomeDocument[] = [];
      for (const file of Array.from(files)) {
        // Only handle images for now — disclosure PDFs are a future pass.
        if (!file.type.startsWith('image/')) {
          continue;
        }
        const thumbnail = await generateThumbnail(file);
        const formData = new FormData();
        formData.append('photo', file);
        const res = await fetch('/api/home-documents', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text.slice(0, 200) || `Upload failed (${res.status})`);
        }
        const data = (await res.json()) as { key: string; bucket: string };
        newDocs.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          key: data.key,
          bucket: data.bucket,
          filename: file.name,
          contentType: file.type,
          thumbnail,
          uploadedAt: new Date().toISOString(),
        });
      }
      const next = [...newDocs, ...docs];
      setDocs(next);
      saveDocuments(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleRemove(id: string) {
    const next = docs.filter((d) => d.id !== id);
    setDocs(next);
    saveDocuments(next);
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-od-navy">Home documents</h2>
        <span className="text-xs text-od-subtle">Stored privately to your home</span>
      </div>
      <p className="mt-1 text-sm text-od-muted">
        Upload water heater photos, panel labels, receipts — anything you want your home to
        remember.
      </p>

      <div className="mt-3 rounded-2xl border border-dashed border-od-primary/40 bg-od-primary-soft/40 p-4 text-center">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-od-navy px-4 py-2 text-sm font-semibold text-white hover:bg-od-navy/90">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading ? 'Uploading…' : 'Upload photo'}
        </label>
        <p className="mt-2 text-xs text-od-muted">
          JPEG/PNG. Stored to Amazon S3. Thumbnail kept on this device.
        </p>
        {error && (
          <p className="mt-2 rounded-md bg-od-red-soft px-2 py-1 text-xs font-semibold text-od-red">
            {error}
          </p>
        )}
      </div>

      {docs.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="group relative overflow-hidden rounded-xl border border-od-border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.thumbnail}
                alt={doc.filename}
                className="aspect-square w-full object-cover"
              />
              <div className="px-2 py-1.5">
                <p className="line-clamp-1 text-[11px] font-medium text-od-navy">
                  {doc.filename}
                </p>
                <p className="text-[10px] text-od-subtle">
                  {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(doc.id)}
                aria-label={`Remove ${doc.filename}`}
                className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-od-red opacity-0 transition-opacity group-hover:opacity-100"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
