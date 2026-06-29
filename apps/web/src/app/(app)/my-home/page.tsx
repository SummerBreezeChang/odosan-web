'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bolt,
  Camera,
  CloudRain,
  Droplet,
  Hammer,
  Home,
  Trees,
  Wind,
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
import { Chip } from '@/components/brand/Chip';
import { ButtonLink } from '@/components/brand/Button';
import { EmptyState } from '@/components/brand/EmptyState';
import { InfoBanner } from '@/components/brand/InfoBanner';

// ─── Constants ───────────────────────────────────────────────────────────────


const SYSTEM_ICONS: Record<SystemType, LucideIcon> = {
  water_heater: Droplet,
  hvac: Wind,
  electrical_panel: Bolt,
  roof_invoice: Home,
};

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
    when: 'Quarterly',
    why: 'A clogged filter cuts efficiency ~15% and shortens the unit\'s life.',
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
    when: 'Annual',
    why: 'Catch a slipped shingle or cracked flashing before a leak finds your ceiling.',
    category: 'roofing',
    icon: Home,
  },
  {
    id: 'sump-pump',
    title: 'Sump pump test',
    when: 'Before rainy season',
    why: 'Pour a bucket in. If it doesn\'t pump out, you find out now — not at 3 a.m.',
    category: 'plumbing_drainage',
    icon: Droplet,
  },
];

// ─── Tab definitions ─────────────────────────────────────────────────────────

type TabId = 'systems' | 'documents' | 'seasonal';

const TABS: { id: TabId; label: string }[] = [
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'documents', label: 'Documents' },
  { id: 'systems', label: 'Systems' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MyHomePage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [systems, setSystems] = useState<SystemRecord[]>([]);
  const [briefs, setBriefs] = useState<DiagnosisBrief[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('seasonal');
  const [migrationStatus, setMigrationStatus] = useState<
    'idle' | 'migrating' | 'done' | 'failed'
  >('idle');

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      if (session?.user) {
        const local = loadHomeRecord();
        const hasLocal = local.briefs.length > 0 || local.systems.length > 0;
        if (hasLocal && migrationStatus === 'idle') {
          setMigrationStatus('migrating');
          const result = await migrateLocalToRemote();
          if (cancelled) return;
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
          if (remote.briefs.length === 0 && remote.systems.length === 0) {
            const local = loadHomeRecord();
            setSystems(local.systems);
            setBriefs(local.briefs);
          } else {
            setSystems(remote.systems);
            setBriefs(remote.briefs);
          }
        } else {
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
    function onFocus() { void refresh(); }
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

      {/* ── Tab chips ── */}
      <div
        className="mt-6 flex gap-2 overflow-x-auto pb-0.5"
        role="tablist"
        aria-label="My home sections"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${
                active
                  ? 'border-od-ink bg-od-ink text-od-bg'
                  : 'border-od-border bg-white text-od-navy hover:border-od-ink/30 hover:bg-od-cream'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Panels ── */}
      <div className="mt-5">
        {activeTab === 'systems' && (
          <SystemsPanel systems={systems} />
        )}
        {activeTab === 'documents' && (
          <DocumentsPanel />
        )}
        {activeTab === 'seasonal' && (
          <SeasonalPanel />
        )}
      </div>

      <InfoBanner
        tone="neutral"
        title="Coming soon."
        body="A transferable Home Health Scorecard at resale — proof you've taken care of the place."
        className="mt-10"
      />
    </div>
  );
}

// ─── Diagnoses panel ─────────────────────────────────────────────────────────

// ─── Systems panel ────────────────────────────────────────────────────────────

function SystemsPanel({ systems }: { systems: SystemRecord[] }) {
  if (systems.length === 0) {
    return (
      <EmptyState
        heading="No systems scanned yet"
        body="When you DIY, scanning your water heater, HVAC, or panel adds it here."
        cta={{ href: '/my-home/document', label: 'Scan a system' }}
      />
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-3">
      {systems.map((system) => (
        <SystemTile key={system.id} system={system} />
      ))}
    </ul>
  );
}

function SystemTile({ system }: { system: SystemRecord }) {
  const Icon = SYSTEM_ICONS[system.system_type] ?? Hammer;
  return (
    <li className="flex flex-col overflow-hidden rounded-2xl border border-od-border bg-white">
      {/* Fixed-height visual area */}
      <div className="flex aspect-square w-full items-center justify-center bg-od-primary-soft">
        <Icon className="h-8 w-8 text-od-primary" aria-hidden="true" />
      </div>
      {/* Meta */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        <p
          className="line-clamp-2 text-[12px] font-semibold leading-[1.3] text-od-navy"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {SYSTEM_LABELS[system.system_type]}
        </p>
        {system.estimated_age_years !== null && (
          <p className="text-[10px] text-od-muted">
            ~{system.estimated_age_years}y old
          </p>
        )}
        {system.recall_or_safety_flag && (
          <Chip tone="urgent" className="mt-auto self-start">
            Recall
          </Chip>
        )}
      </div>
    </li>
  );
}

// ─── Documents panel ─────────────────────────────────────────────────────────

type HomeDocument = {
  id: string;
  key: string;
  bucket: string;
  filename: string;
  contentType: string;
  thumbnail: string;
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

function DocumentsPanel() {
  const [docs, setDocs] = useState<HomeDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        if (!file.type.startsWith('image/')) continue;
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
    <div>
      <p className="mb-3 text-[13px] leading-[1.5] text-od-muted">
        Water heater photos, panel labels, receipts — anything you want your home to remember.{' '}
        <span className="text-od-subtle">Stored privately.</span>
      </p>

      {error && (
        <p className="mb-3 rounded-xl bg-od-red-soft px-3 py-2 text-[12px] font-semibold text-od-red">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-3 gap-3">
        {/* Upload tile — always first */}
        <li>
          <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-od-primary/40 bg-od-primary-soft/30 transition-colors hover:bg-od-primary-soft/50">
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            {uploading ? (
              <span className="text-[11px] font-semibold text-od-primary">Uploading…</span>
            ) : (
              <>
                <Camera className="h-7 w-7 text-od-primary" aria-hidden="true" />
                <span className="mt-1.5 text-center text-[11px] font-semibold leading-tight text-od-primary">
                  Add photo
                </span>
              </>
            )}
          </label>
        </li>

        {/* Uploaded doc tiles */}
        {docs.map((doc) => (
          <li key={doc.id} className="group relative overflow-hidden rounded-2xl border border-od-border bg-white">
            {/* Fixed square image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.thumbnail}
              alt={doc.filename}
              className="aspect-square w-full object-cover"
            />
            {/* Label strip */}
            <div className="px-2 py-1.5">
              <p className="line-clamp-1 text-[11px] font-medium text-od-navy">{doc.filename}</p>
              <p className="text-[10px] text-od-subtle">
                {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            {/* Remove button */}
            <button
              type="button"
              onClick={() => handleRemove(doc.id)}
              aria-label={`Remove ${doc.filename}`}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-[10px] font-bold text-od-red opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Seasonal panel ───────────────────────────────────────────────────────────

function SeasonalPanel() {
  return (
    <div>
      <p className="mb-3 text-[13px] leading-[1.5] text-od-muted">
        Top 5 things first-time homeowners forget. Tap any to diagnose with a photo.
      </p>
      <ul className="grid grid-cols-3 gap-3">
        {SEASONAL_TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <li key={task.id}>
              <a
                href={`/diagnose?category=${task.category}`}
                className="flex flex-col overflow-hidden rounded-2xl border border-od-border bg-white transition-colors hover:border-od-primary/40"
              >
                {/* Visual area */}
                <div className="flex aspect-square w-full items-center justify-center bg-od-primary-soft">
                  <Icon className="h-8 w-8 text-od-primary" aria-hidden="true" />
                </div>
                {/* Meta */}
                <div className="flex flex-1 flex-col gap-0.5 p-2">
                  <p
                    className="line-clamp-2 text-[12px] font-semibold leading-[1.3] text-od-navy"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {task.title}
                  </p>
                  <p className="text-[10px] text-od-subtle">{task.when}</p>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
