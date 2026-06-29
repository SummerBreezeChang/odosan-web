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
  clearAllBriefs,
  fetchRemoteRecord,
  isDemoAccount,
  loadHomeRecord,
  migrateLocalToRemote,
  seedSampleBriefs,
  updateBriefStatus,
  type BriefStatus,
  type DiagnosisBrief,
  type SystemRecord,
  type SystemType,
} from '@/lib/home-record';
import { SEASONAL_TASKS } from '@/lib/seasonal-tasks';
import { Card } from '@/components/brand/Card';
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

// SEASONAL_TASKS now lives in lib/seasonal-tasks.ts — shared with the
// /my-home/seasonal/[slug] detail pages so the card and the detail page
// stay in sync.

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
  const isDemoUser = isDemoAccount(session?.user?.email);

  // Demo accounts (whitelisted in lib/home-record) get the sample
  // diagnoses auto-loaded the first time they land on /my-home with an
  // empty record — populated demo without a manual click. Fires once per
  // session via a ref so we don't loop after the seed insertion.
  const autoSeededRef = useRef(false);
  useEffect(() => {
    if (autoSeededRef.current) return;
    if (sessionLoading) return;
    if (!isDemoUser) return;
    if (briefs.length > 0) return;
    autoSeededRef.current = true;
    seedSampleBriefs();
    setBriefs(loadHomeRecord().briefs);
  }, [isDemoUser, briefs.length, sessionLoading]);

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-8 sm:px-6">
      <h1
        className="text-[34px] font-semibold leading-[1.1] tracking-tight text-od-ink"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        My home
      </h1>

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
        <h2
          id="diagnoses-heading"
          className="text-[22px] font-semibold leading-[1.2] text-od-ink"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Saved diagnoses
        </h2>
        {isDemoUser && (
          <button
            type="button"
            onClick={() => {
              clearAllBriefs();
              seedSampleBriefs();
              setBriefs(loadHomeRecord().briefs);
            }}
            className="mt-1 text-[12px] text-od-muted underline-offset-2 hover:text-od-leaf hover:underline"
          >
            Reset demo data
          </button>
        )}
        <div className="mt-3">
          <DiagnosesPanel
            briefs={briefs}
            onStatusChange={(id, status) => {
              const updated = updateBriefStatus(id, status);
              if (!updated) return;
              setBriefs((prev) => prev.map((b) => (b.id === id ? updated : b)));
            }}
          />
        </div>
      </section>

      {/* ── Take care of your home — three action surfaces ── */}
      <section aria-labelledby="actions-heading" className="mt-10">
        <h2
          id="actions-heading"
          className="mb-4 text-[22px] font-semibold leading-[1.2] text-od-ink"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Take care of your home
        </h2>
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
}: {
  briefs: DiagnosisBrief[];
  onStatusChange: (id: string, status: BriefStatus) => void;
}) {
  if (briefs.length === 0) {
    return (
      <EmptyState
        heading="No diagnoses saved yet"
        body="Diagnose your first home problem and it'll auto-save here."
        cta={{ href: '/diagnose', label: 'Diagnose a problem' }}
      />
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
          className="line-clamp-2 min-h-[32px] text-[12px] font-semibold leading-[1.3] text-od-navy"
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
        {/* Upload tile — same overall dimensions as Systems / doc tiles
            (aspect-square visual area + meta strip below) so the grid
            rows align. Dashed border + tinted top keeps it visually
            distinct as an "add" affordance. */}
        <li>
          <label className="flex cursor-pointer flex-col overflow-hidden rounded-2xl border-2 border-dashed border-od-primary/40 bg-white transition-colors hover:border-od-primary/60">
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={uploading}
            />
            {/* Square visual */}
            <div className="flex aspect-square w-full items-center justify-center bg-od-primary-soft/30">
              {uploading ? null : (
                <Upload className="h-8 w-8 text-od-primary" aria-hidden="true" />
              )}
            </div>
            {/* Meta strip — mirrors Systems-tile two-line title */}
            <div className="flex flex-1 flex-col gap-1 p-2">
              <p
                className="line-clamp-2 min-h-[32px] text-[12px] font-semibold leading-[1.3] text-od-primary"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {uploading ? 'Uploading…' : 'Add PDF or photo'}
              </p>
            </div>
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
        Top 5 things first-time homeowners forget. Tap any to see the basics, then diagnose with a photo.
      </p>
      <ul className="grid grid-cols-3 gap-3">
        {SEASONAL_TASKS.map((task) => {
          const Icon = task.icon;
          return (
            <li key={task.id} className="h-full">
              <a
                href={`/my-home/seasonal/${task.id}`}
                className="flex h-full flex-col overflow-hidden rounded-2xl border border-od-border bg-white transition-colors hover:border-od-primary/40"
              >
                {/* Visual area */}
                <div className="flex aspect-square w-full items-center justify-center bg-od-primary-soft">
                  <Icon className="h-8 w-8 text-od-primary" aria-hidden="true" />
                </div>
                {/* Meta — flex-1 stretches to fill grid-cell height; justify-center
                    distributes any extra space evenly above and below the title+when
                    block so 1-line-title cards don't leave a gap below their text. */}
                <div className="flex flex-1 flex-col justify-center gap-0.5 p-2">
                  <p
                    className="line-clamp-2 text-[12px] font-semibold leading-[1.3] text-od-navy"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {task.title}
                  </p>
                  <p className="line-clamp-1 text-[10px] text-od-subtle">{task.when}</p>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
