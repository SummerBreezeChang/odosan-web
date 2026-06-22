/**
 * Home record store — keyed by parcel_id, persisted in localStorage.
 *
 * This is the hackathon-friendly persistence layer: no auth gating, works
 * for any visitor, instantly demoable. Production would mirror this to a
 * `home_systems` table tied to the signed-in user.
 */

export type SystemType = 'water_heater' | 'hvac' | 'electrical_panel' | 'roof_invoice';

export type SystemRecord = {
  id: string; // local uuid, used as React key
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
  documented_at: string; // ISO timestamp
};

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
  saved_at: string; // ISO timestamp
};

export type HomeRecord = {
  parcel_id: string;
  systems: SystemRecord[];
  briefs: DiagnosisBrief[];
};

const STORAGE_PREFIX = 'odosan:home-record:';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function key(parcelId: string): string {
  return `${STORAGE_PREFIX}${parcelId}`;
}

export function loadHomeRecord(parcelId: string): HomeRecord {
  const empty: HomeRecord = { parcel_id: parcelId, systems: [], briefs: [] };
  if (!isBrowser()) return empty;
  try {
    const raw = window.localStorage.getItem(key(parcelId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<HomeRecord>;
    if (!parsed?.parcel_id) return empty;
    return {
      parcel_id: parsed.parcel_id,
      systems: Array.isArray(parsed.systems) ? parsed.systems : [],
      briefs: Array.isArray(parsed.briefs) ? parsed.briefs : [],
    };
  } catch {
    return empty;
  }
}

function genId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function writeRecord(record: HomeRecord): void {
  if (isBrowser()) {
    window.localStorage.setItem(key(record.parcel_id), JSON.stringify(record));
  }
}

export function saveSystem(parcelId: string, record: Omit<SystemRecord, 'id' | 'documented_at'>): SystemRecord {
  const stored = loadHomeRecord(parcelId);
  const next: SystemRecord = {
    ...record,
    id: genId(),
    documented_at: new Date().toISOString(),
  };
  // Latest record per system_type wins — replace existing entry of the same type.
  const filtered = stored.systems.filter((s) => s.system_type !== record.system_type);
  writeRecord({ ...stored, systems: [...filtered, next] });
  return next;
}

export function removeSystem(parcelId: string, systemType: SystemType): void {
  const stored = loadHomeRecord(parcelId);
  writeRecord({
    ...stored,
    systems: stored.systems.filter((s) => s.system_type !== systemType),
  });
}

export function saveBrief(parcelId: string, brief: Omit<DiagnosisBrief, 'id' | 'saved_at'>): DiagnosisBrief {
  const stored = loadHomeRecord(parcelId);
  const next: DiagnosisBrief = {
    ...brief,
    id: genId(),
    saved_at: new Date().toISOString(),
  };
  // Keep latest 10 briefs, newest first.
  const updated = [next, ...stored.briefs].slice(0, 10);
  writeRecord({ ...stored, briefs: updated });
  return next;
}

export function removeBrief(parcelId: string, briefId: string): void {
  const stored = loadHomeRecord(parcelId);
  writeRecord({
    ...stored,
    briefs: stored.briefs.filter((b) => b.id !== briefId),
  });
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
