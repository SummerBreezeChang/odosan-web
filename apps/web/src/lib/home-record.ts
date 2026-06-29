/**
 * Home record store — single global key, persisted in localStorage.
 *
 * "My home" is one record per visitor, not one-per-address. The Lovable
 * spec frames it as a lightweight record of *your* home that grows every
 * time you diagnose something or scan a system.
 *
 * For the hackathon: localStorage is enough. Production would mirror this
 * to a `home_record` table tied to the signed-in user.
 */

export type SystemType = 'water_heater' | 'hvac' | 'electrical_panel' | 'roof_invoice';

export type SystemRecord = {
  id: string;
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
  documented_at: string;
};

export type BriefStatus = 'open' | 'planned' | 'fixed';

export type DiagnosisBrief = {
  id: string;
  category: string;
  neighborhood: string;
  issue: string;
  severity: 'urgent' | 'soon' | 'monitor';
  scopeOfWork: string;
  fairPriceRange: string;
  diyOrPro: 'diy' | 'pro';
  explanation: string;
  confidence: number;
  diyShoppingQuery: string;
  saved_at: string;
  // ── Journey tracking ──────────────────────────────────────────────────
  // status defaults to 'open' on save. fixed_at is stamped when the user
  // marks the brief as fixed and cleared if they flip back to open/planned.
  // Older briefs that pre-date this field are treated as 'open' on load.
  status?: BriefStatus;
  fixed_at?: string;
};

export type HomeRecord = {
  systems: SystemRecord[];
  briefs: DiagnosisBrief[];
};

const STORAGE_KEY = 'odosan:home-record';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function genId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function emptyRecord(): HomeRecord {
  return { systems: [], briefs: [] };
}

function writeRecord(record: HomeRecord): void {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  }
}

export function loadHomeRecord(): HomeRecord {
  if (!isBrowser()) return emptyRecord();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyRecord();
    const parsed = JSON.parse(raw) as Partial<HomeRecord>;
    return {
      systems: Array.isArray(parsed.systems) ? parsed.systems : [],
      briefs: Array.isArray(parsed.briefs) ? parsed.briefs : [],
    };
  } catch {
    return emptyRecord();
  }
}

export function saveSystem(record: Omit<SystemRecord, 'id' | 'documented_at'>): SystemRecord {
  const stored = loadHomeRecord();
  const next: SystemRecord = {
    ...record,
    id: genId(),
    documented_at: new Date().toISOString(),
  };
  const filtered = stored.systems.filter((s) => s.system_type !== record.system_type);
  writeRecord({ ...stored, systems: [...filtered, next] });
  return next;
}

export function removeSystem(systemType: SystemType): void {
  const stored = loadHomeRecord();
  writeRecord({
    ...stored,
    systems: stored.systems.filter((s) => s.system_type !== systemType),
  });
}

export function saveBrief(brief: Omit<DiagnosisBrief, 'id' | 'saved_at'>): DiagnosisBrief {
  const stored = loadHomeRecord();
  const next: DiagnosisBrief = {
    ...brief,
    id: genId(),
    saved_at: new Date().toISOString(),
    status: 'open',
  };
  const updated = [next, ...stored.briefs].slice(0, 20);
  writeRecord({ ...stored, briefs: updated });
  return next;
}

export function removeBrief(briefId: string): void {
  const stored = loadHomeRecord();
  writeRecord({
    ...stored,
    briefs: stored.briefs.filter((b) => b.id !== briefId),
  });
}

/**
 * Set the status of a brief. Stamps fixed_at on transition to 'fixed' and
 * clears it on transition away. localStorage-only for now — Aurora sync
 * is Phase 2 once we add a status column + PATCH endpoint.
 */
export function updateBriefStatus(briefId: string, status: BriefStatus): DiagnosisBrief | null {
  const stored = loadHomeRecord();
  let updated: DiagnosisBrief | null = null;
  const briefs = stored.briefs.map((b) => {
    if (b.id !== briefId) return b;
    const next: DiagnosisBrief = {
      ...b,
      status,
      fixed_at: status === 'fixed' ? new Date().toISOString() : undefined,
    };
    updated = next;
    return next;
  });
  if (!updated) return null;
  writeRecord({ ...stored, briefs });
  return updated;
}

// ─── Server sync ──────────────────────────────────────────────────────────────
// These helpers persist the same shape to Aurora when the user is signed in.
// Components call them fire-and-forget after the local save — UI stays instant,
// the DB write happens in the background.

export async function fetchRemoteRecord(): Promise<HomeRecord | null> {
  try {
    const res = await fetch('/api/home-record', { credentials: 'include' });
    if (!res.ok) return null;
    const data = (await res.json()) as HomeRecord;
    return {
      systems: Array.isArray(data.systems) ? data.systems : [],
      briefs: Array.isArray(data.briefs) ? data.briefs : [],
    };
  } catch {
    return null;
  }
}

export async function syncBriefToServer(brief: Omit<DiagnosisBrief, 'id' | 'saved_at'>): Promise<void> {
  try {
    await fetch('/api/home-record/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(brief),
    });
  } catch (err) {
    console.error('[syncBriefToServer]', err);
  }
}

export async function syncSystemToServer(
  system: Omit<SystemRecord, 'id' | 'documented_at'> & {
    photo_s3_bucket?: string | null;
    photo_s3_key?: string | null;
    photo_s3_region?: string | null;
  }
): Promise<void> {
  try {
    await fetch('/api/home-record/system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(system),
    });
  } catch (err) {
    console.error('[syncSystemToServer]', err);
  }
}

export async function migrateLocalToRemote(): Promise<{
  briefsInserted: number;
  systemsInserted: number;
} | null> {
  if (!isBrowser()) return null;
  const local = loadHomeRecord();
  if (local.briefs.length === 0 && local.systems.length === 0) {
    return { briefsInserted: 0, systemsInserted: 0 };
  }
  try {
    const res = await fetch('/api/home-record/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(local),
    });
    if (!res.ok) return null;
    return (await res.json()) as { briefsInserted: number; systemsInserted: number };
  } catch (err) {
    console.error('[migrateLocalToRemote]', err);
    return null;
  }
}

export const SYSTEM_LABELS: Record<SystemType, string> = {
  water_heater: 'Water heater',
  hvac: 'HVAC',
  electrical_panel: 'Electrical panel',
  roof_invoice: 'Roof',
};

export const ALL_SYSTEM_TYPES: SystemType[] = [
  'water_heater',
  'hvac',
  'electrical_panel',
  'roof_invoice',
];
