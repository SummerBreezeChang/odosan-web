'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Bolt,
  Camera,
  CloudRain,
  Droplet,
  FileText,
  Hammer,
  Home,
  Trees,
  Upload,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import {
  SYSTEM_LABELS,
  fetchRemoteRecord,
  loadHomeRecord,
  migrateLocalToRemote,
  seedSampleBriefs,
  updateBriefStatus,
  type BriefStatus,
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
// Saved diagnoses live in their own section above these tabs — they are a
// record of past AI diagnoses, not an "action" the user can take here.
// The tabs hold the three distinct upload/action surfaces.

type TabId = 'seasonal' | 'documents' | 'systems';

const TABS: { id: TabId; label: string }[] = [
  { id: 'seasonal', label: 'Seasonal' },
  { id: 'documents', label: 'Documents' },
  { id: 'systems', label: 'Systems' },
];

// Used by the Diagnoses panel — diagnose briefs are stored with a category
// string from the diagnose-page taxonomy.
const BRIEF_CATEGORY_ICONS: Record<string, LucideIcon> = {
  plumbing_drainage: Droplet,
  gutters_drainage: CloudRain,
  landscaping: Trees,
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

      {/* ── Saved diagnoses (history section, always visible) ── */}
      <section aria-labelledby="diagnoses-heading" className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <SectionHeader
            id="diagnoses-heading"
            title="Saved diagnoses"
            subtitle="Everything Odosan has diagnosed for your home, with severity, fair price, and next step."
            size="h2"
          />
          <ButtonLink
            href="/diagnose"
            variant="ghost"
            className="shrink-0 whitespace-nowrap"
          >
            Diagnose another
          </ButtonLink>
        </div>
        <DiagnosesPanel
          briefs={briefs}
          onStatusChange={(id, status) => {
            const updated = updateBriefStatus(id, status);
            if (!updated) return;
            setBriefs((prev) => prev.map((b) => (b.id === id ? updated : b)));
          }}
          onSeedSamples={() => {
            seedSampleBriefs();
            setBriefs(loadHomeRecord().briefs);
          }}
        />
      </section>

      {/* ── Take care of your home — three action surfaces ── */}
      <section aria-labelledby="actions-heading" className="mt-10">
        <SectionHeader
          id="actions-heading"
          title="Take care of your home"
          subtitle="Seasonal reminders, paperwork to keep with your home, and the systems you've scanned."
          size="h2"
          className="mb-4"
        />
        <div
          className="flex gap-2 overflow-x-auto pb-0.5"
          role="tablist"
          aria-label="My home actions"
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

// ─── Diagnoses panel ─────────────────────────────────────────────────────────

const STATUS_TONE: Record<BriefStatus, 'urgent' | 'soon' | 'good'> = {
  open: 'urgent',
  planned: 'soon',
  fixed: 'good',
};

const STATUS_LABEL: Record<BriefStatus, string> = {
  open: 'Open',
  planned: 'Planned',
  fixed: 'Fixed',
};

function briefStatus(b: DiagnosisBrief): BriefStatus {
  return b.status ?? 'open';
}

function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

function DiagnosesPanel({
  briefs,
  onStatusChange,
  onSeedSamples,
}: {
  briefs: DiagnosisBrief[];
  onStatusChange: (id: string, status: BriefStatus) => void;
  onSeedSamples: () => void;
}) {
  if (briefs.length === 0) {
    return (
      <div className="mt-3 flex flex-col items-center justify-center rounded-[18px] border border-od-border bg-white/60 px-6 py-10 text-center shadow-[0_1px_2px_rgba(27,56,42,0.05)]">
        <p className="text-[15px] font-semibold text-od-navy">No diagnoses saved yet</p>
        <p className="mt-1.5 max-w-xs text-[13px] leading-[1.5] text-od-muted">
          Diagnose your first home problem and it&apos;ll auto-save here.
        </p>
        <div className="mt-5">
          <ButtonLink href="/diagnose">Diagnose a problem</ButtonLink>
        </div>
        <button
          type="button"
          onClick={onSeedSamples}
          className="mt-3 text-[12px] text-od-muted underline-offset-2 transition-colors hover:text-od-leaf hover:underline"
        >
          Or load 3 sample diagnoses for a quick preview
        </button>
      </div>
    );
  }

  const counts = briefs.reduce(
    (acc, b) => {
      acc[briefStatus(b)] += 1;
      return acc;
    },
    { open: 0, planned: 0, fixed: 0 } as Record<BriefStatus, number>
  );

  return (
    <>
      {/* Counter strip — the journey summary, at a glance */}
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-od-muted">
        <StatusCount tone="urgent" count={counts.open} label="Open" />
        <StatusCount tone="soon" count={counts.planned} label="Planned" />
        <StatusCount tone="good" count={counts.fixed} label="Fixed" />
      </div>
      <ul className="space-y-3">
        {briefs.map((brief) => (
          <DiagnosisCard
            key={brief.id}
            brief={brief}
            onStatusChange={(status) => onStatusChange(brief.id, status)}
          />
        ))}
      </ul>
    </>
  );
}

function StatusCount({
  tone,
  count,
  label,
}: {
  tone: 'urgent' | 'soon' | 'good';
  count: number;
  label: string;
}) {
  const dotColor =
    tone === 'urgent' ? 'bg-od-red' : tone === 'soon' ? 'bg-od-orange' : 'bg-od-green';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dotColor}`} aria-hidden="true" />
      <span className="font-semibold text-od-navy">{count}</span>
      <span>{label}</span>
    </span>
  );
}

function DiagnosisCard({
  brief,
  onStatusChange,
}: {
  brief: DiagnosisBrief;
  onStatusChange: (status: BriefStatus) => void;
}) {
  const Icon = BRIEF_CATEGORY_ICONS[brief.category] ?? Hammer;
  const categoryLabel = BRIEF_CATEGORY_LABELS[brief.category] ?? brief.category;
  const status = briefStatus(brief);
  const daysToFix =
    status === 'fixed' && brief.fixed_at ? daysBetween(brief.saved_at, brief.fixed_at) : null;

  return (
    <li className="flex gap-3 rounded-2xl border border-od-border bg-white p-4">
      <div
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-od-primary-soft"
      >
        <Icon className="h-5 w-5 text-od-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <Chip tone={SEVERITY_TONE[brief.severity]}>{brief.severity.toUpperCase()}</Chip>
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-od-muted">
            {categoryLabel}
          </span>
          <Chip tone={brief.diyOrPro === 'diy' ? 'leaf' : 'neutral'}>
            {brief.diyOrPro === 'diy' ? 'DIY' : 'Pro'}
          </Chip>
          <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
          <span className="ml-auto text-[11px] text-od-subtle">
            {new Date(brief.saved_at).toLocaleDateString()}
          </span>
        </div>
        <p
          className="mt-2 text-[15px] font-semibold leading-[1.3] text-od-navy"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {brief.issue}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-[1.45] text-od-muted">
          {brief.scopeOfWork}
        </p>
        <p className="mt-2 text-[12px] text-od-muted">
          Fair range:{' '}
          <span className="font-semibold text-od-navy">{brief.fairPriceRange}</span>
        </p>

        {/* Status toggle — three segmented buttons */}
        <div
          className="mt-3 inline-flex overflow-hidden rounded-full border border-od-border bg-white text-[12px] font-semibold"
          role="group"
          aria-label="Update status"
        >
          {(['open', 'planned', 'fixed'] as const).map((s, i) => {
            const active = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(s)}
                aria-pressed={active}
                className={`px-3 py-1.5 transition-colors ${
                  i > 0 ? 'border-l border-od-border' : ''
                } ${
                  active
                    ? 'bg-od-ink text-od-bg'
                    : 'bg-white text-od-navy hover:bg-od-cream'
                }`}
              >
                {STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>

        {/* Resolution annotation — only when Fixed */}
        {status === 'fixed' && brief.fixed_at && (
          <p className="mt-2 text-[12px] text-od-green">
            ✓ Fixed {new Date(brief.fixed_at).toLocaleDateString()}
            {daysToFix !== null &&
              ` · ${daysToFix} ${daysToFix === 1 ? 'day' : 'days'} from diagnosis`}
          </p>
        )}
      </div>
    </li>
  );
}

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
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf';
        if (!isImage && !isPdf) continue;
        // Images get a real thumbnail; PDFs render with a FileText icon
        // since we can't preview them client-side without a PDF lib.
        const thumbnail = isImage ? await generateThumbnail(file) : '';
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
        <span className="font-semibold text-od-navy">Paperwork for your home</span> — disclosure
        papers, contractor receipts, appliance warranties, inspection PDFs. Not the same as a
        diagnosis photo. Stored privately.
      </p>

      {error && (
        <p className="mb-3 rounded-xl bg-od-red-soft px-3 py-2 text-[12px] font-semibold text-od-red">
          {error}
        </p>
      )}

      <ul className="grid grid-cols-3 gap-3">
        {/* Upload tile — always first */}
        <li>
          <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-od-primary/40 bg-od-primary-soft/30 px-2 text-center transition-colors hover:bg-od-primary-soft/50">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            {uploading ? (
              <span className="text-[11px] font-semibold text-od-primary">Uploading…</span>
            ) : (
              <>
                <Upload className="h-7 w-7 text-od-primary" aria-hidden="true" />
                <span className="mt-1.5 text-[11px] font-semibold leading-tight text-od-primary">
                  Add PDF or photo
                </span>
              </>
            )}
          </label>
        </li>

        {/* Uploaded doc tiles */}
        {docs.map((doc) => (
          <li
            key={doc.id}
            className="group relative overflow-hidden rounded-2xl border border-od-border bg-white"
          >
            {/* Square preview area — image thumb for photos, FileText icon for PDFs */}
            {doc.contentType === 'application/pdf' || !doc.thumbnail ? (
              <div className="flex aspect-square w-full items-center justify-center bg-od-cream">
                <FileText className="h-8 w-8 text-od-primary" aria-hidden="true" />
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={doc.thumbnail}
                alt={doc.filename}
                className="aspect-square w-full object-cover"
              />
            )}
            {/* Label strip */}
            <div className="px-2 py-1.5">
              <p className="line-clamp-1 text-[11px] font-medium text-od-navy">{doc.filename}</p>
              <p className="text-[10px] text-od-subtle">
                {doc.contentType === 'application/pdf' ? 'PDF · ' : ''}
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
