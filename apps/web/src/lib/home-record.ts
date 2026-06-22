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

export type HomeRecord = {
  parcel_id: string;
  systems: SystemRecord[];
};

const STORAGE_PREFIX = 'odosan:home-record:';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function key(parcelId: string): string {
  return `${STORAGE_PREFIX}${parcelId}`;
}

export function loadHomeRecord(parcelId: string): HomeRecord {
  if (!isBrowser()) return { parcel_id: parcelId, systems: [] };
  try {
    const raw = window.localStorage.getItem(key(parcelId));
    if (!raw) return { parcel_id: parcelId, systems: [] };
    const parsed = JSON.parse(raw) as HomeRecord;
    return parsed?.parcel_id ? parsed : { parcel_id: parcelId, systems: [] };
  } catch {
    return { parcel_id: parcelId, systems: [] };
  }
}

export function saveSystem(parcelId: string, record: Omit<SystemRecord, 'id' | 'documented_at'>): SystemRecord {
  const stored = loadHomeRecord(parcelId);
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const next: SystemRecord = {
    ...record,
    id,
    documented_at: new Date().toISOString(),
  };
  // Latest record per system_type wins — replace existing entry of the same type.
  const filtered = stored.systems.filter((s) => s.system_type !== record.system_type);
  const updated: HomeRecord = {
    parcel_id: parcelId,
    systems: [...filtered, next],
  };
  if (isBrowser()) {
    window.localStorage.setItem(key(parcelId), JSON.stringify(updated));
  }
  return next;
}

export function removeSystem(parcelId: string, systemType: SystemType): void {
  const stored = loadHomeRecord(parcelId);
  const updated: HomeRecord = {
    parcel_id: parcelId,
    systems: stored.systems.filter((s) => s.system_type !== systemType),
  };
  if (isBrowser()) {
    window.localStorage.setItem(key(parcelId), JSON.stringify(updated));
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
