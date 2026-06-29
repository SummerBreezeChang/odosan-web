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
import { Card } from '@/components/brand/Card';
import { SectionHeader } from '@/components/brand/SectionHeader';
import { Chip, severityTone } from '@/components/brand/Chip';
import { ButtonLink } from '@/components/brand/Button';
import { EmptyState } from '@/components/brand/EmptyState';
import { InfoBanner } from '@/components/brand/InfoBanner';

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
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-8 sm:px-6">
      <SectionHeader
        eyebrow={isSignedIn ? 'Your account' : undefined}
        title="My home"
        subtitle={
          isSignedIn
            ? `Welcome back${session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}. Your maintenance record, saved to your account.`
            : "A lightweight record of your home's health. It grows every time you diagnose something."
        }
        size="h1"
      />

      {!sessionLoading && !isSignedIn && hasAnyData && (
        <InfoBanner
          tone="leaf"
          title="Save this across devices"
          body="Right now your record is on this browser only. Create a free account to keep it safe — open it from your phone, share it with a pro, take it with you."
          action={
            <ButtonLink href="/account/signup?next=/my-home" size="md">
              Create a free account
            </ButtonLink>
          }
          className="mt-5"
        />
      )}

      {migrationStatus === 'done' && hasAnyData && (
        <InfoBanner
          tone="good"
          title="Your previous record has been moved to your account."
          className="mt-4"
        />
      )}

      {migrationStatus === 'failed' && (
        <InfoBanner
          tone="soon"
          title="Couldn't sync your record to your account yet."
          body={
            <>
              Your data is still safe in this browser — nothing was lost. Try refreshing in a
              moment. If the issue persists, contact{' '}
              <a href="mailto:contact@odosan.tech" className="underline">
                contact@odosan.tech
              </a>
              .
            </>
          }
          className="mt-4"
        />
      )}

      <SeasonalCard />

      <HomeDocumentsCard />

      <section className="mt-8" aria-labelledby="saved-diagnoses-heading">
        <SectionHeader id="saved-diagnoses-heading" title="Saved diagnoses" size="h2" className="mb-1" />
        {briefs.length === 0 ? (
          <EmptyState
            heading="Nothing saved yet"
            body="Diagnose your first problem and tap 'Save to My home' to start a record."
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

      <section className="mt-10" aria-labelledby="scanned-systems-heading">
        <SectionHeader id="scanned-systems-heading" title="Scanned systems" size="h2" className="mb-1" />
        {systems.length === 0 ? (
          <EmptyState
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

      <InfoBanner
        tone="neutral"
        title="Coming soon."
        body="A transferable Home Health Scorecard at resale — proof you've taken care of the place."
        className="mt-10"
      />
    </div>
  );
}



function BriefCard({ brief }: { brief: DiagnosisBrief }) {
  const savedDate = new Date(brief.saved_at);
  const Icon = CATEGORY_ICONS[brief.category] ?? Wrench;
  return (
    <li>
      <Card className="flex gap-3">
        <div
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-od-primary-soft text-od-primary"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={severityTone(brief.severity)}>
              {brief.severity.toUpperCase()}
            </Chip>
            <Chip tone="neutral">
              {CATEGORY_LABELS[brief.category] ?? brief.category}
            </Chip>
            <Chip tone={brief.diyOrPro === 'diy' ? 'leaf' : 'neutral'}>
              {brief.diyOrPro === 'diy' ? 'DIY' : 'Pro'}
            </Chip>
            <span className="ml-auto text-[12px] text-od-subtle">
              {savedDate.toLocaleDateString()}
            </span>
          </div>
          <p
            className="mt-2 text-[15px] font-semibold text-od-navy"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {brief.issue}
          </p>
          <p className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-od-muted">
            {brief.scopeOfWork}
          </p>
          <p className="mt-2 text-[12px] text-od-muted">
            Fair range:{' '}
            <span className="font-semibold text-od-navy">{brief.fairPriceRange}</span>
          </p>
        </div>
      </Card>
    </li>
  );
}

function SystemCard({ system }: { system: SystemRecord }) {
  const Icon = SYSTEM_ICONS[system.system_type] ?? Hammer;
  return (
    <li>
      <Card className="flex gap-3">
        <div
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-od-primary-soft text-od-primary"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p
              className="text-[15px] font-semibold text-od-navy"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {SYSTEM_LABELS[system.system_type]}
            </p>
            <span className="text-[12px] text-od-subtle">
              Scanned {new Date(system.documented_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-od-body">
            {system.make ?? 'Unknown brand'}
            {system.capacity ? ` · ${system.capacity}` : ''}
          </p>
          {system.estimated_age_years !== null && (
            <p className="mt-1 text-[12px] text-od-muted">
              ~{system.estimated_age_years} years old
              {system.expected_lifespan_years
                ? ` · ~${system.expected_lifespan_years}y typical lifespan`
                : ''}
            </p>
          )}
          {system.recall_or_safety_flag && (
            <Chip tone="urgent" className="mt-2">
              {system.recall_or_safety_flag}
            </Chip>
          )}
        </div>
      </Card>
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
    <section className="mt-8" aria-labelledby="seasonal-heading">
      <SectionHeader
        id="seasonal-heading"
        title="Seasonal maintenance"
        subtitle="Top 5 things first-time homeowners forget. Tap any to diagnose with a photo."
        size="h2"
        className="mb-3"
      />
      <ul className="space-y-2.5">
        {SEASONAL_TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <li key={task.id}>
              <Card className="flex gap-3">
                <div
                  aria-hidden
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-od-primary-soft text-od-primary"
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p
                      className="text-[15px] font-semibold text-od-navy"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {task.title}
                    </p>
                    <span className="text-[12px] text-od-subtle">{task.when}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-[1.5] text-od-muted">{task.why}</p>
                  <a
                    href={`/diagnose?category=${task.category}`}
                    className="mt-2 inline-flex items-center text-[13px] font-semibold text-od-primary hover:text-od-leaf"
                  >
                    Diagnose with a photo →
                  </a>
                </div>
              </Card>
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
    <section className="mt-8" aria-labelledby="home-docs-heading">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <SectionHeader id="home-docs-heading" title="Home documents" size="h2" />
        <span className="text-[12px] text-od-subtle">Stored privately</span>
      </div>
      <p className="mt-1 text-[13px] leading-[1.5] text-od-muted">
        Upload water heater photos, panel labels, receipts — anything you want your home to
        remember.
      </p>

      <div className="mt-3 rounded-[18px] border border-dashed border-od-primary/40 bg-od-primary-soft/40 p-4 text-center">
        <label className="od-btn-primary cursor-pointer">
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
        <p className="mt-2 text-[12px] text-od-muted">
          JPEG/PNG. Stored to Amazon S3. Thumbnail kept on this device.
        </p>
        {error && (
          <p className="mt-2 rounded-md bg-od-red-soft px-2 py-1 text-[12px] font-semibold text-od-red">
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
