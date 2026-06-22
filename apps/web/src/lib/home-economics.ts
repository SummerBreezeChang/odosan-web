/**
 * Home economics — cost forecasting + rebate math.
 *
 * All numbers here are static lookups for the hackathon demo. Sources:
 *  - IRA federal credits: section 25C (Energy Efficient Home Improvement Credit),
 *    25D (Residential Clean Energy Credit). Effective through 2032.
 *  - PG&E + BayREN: typical Bay Area rebate amounts as of 2025. Real amounts
 *    vary by program tier, income, and equipment specifics.
 *
 * Production would replace these with a live rebate API (DSIRE, PG&E partner)
 * and zip-localized labor cost data.
 */

import type { SystemRecord, SystemType } from './home-record';

export type ReplacementOption = {
  label: string; // human label e.g. "Heat pump water heater"
  base_cost_usd: number; // unit + labor
  ira_credit_usd: number; // federal IRA tax credit
  pge_rebate_usd: number; // PG&E rebate
  bayren_rebate_usd: number; // BayREN rebate
  net_cost_usd: number; // base - all credits
  is_upgrade: boolean; // true if this is an electrification upgrade (vs like-for-like)
  rebate_eligible: boolean;
};

export type SystemForecast = {
  system_type: SystemType;
  status: 'overdue' | 'due_soon' | 'watch' | 'ok' | 'unknown';
  due_window_months: number | null; // months until expected end-of-life
  current_age_years: number | null;
  expected_lifespan_years: number | null;
  like_for_like: ReplacementOption;
  upgrade: ReplacementOption | null; // electrification path when applicable
};

// Default lifespan by system type (years).
const DEFAULT_LIFESPAN: Record<SystemType, number> = {
  water_heater: 11, // tank average
  hvac: 17,
  electrical_panel: 35,
  roof_invoice: 25, // asphalt shingle avg
};

// Replacement cost ranges (mid-point, USD, Bay Area labor included).
const REPLACEMENT_COSTS: Record<SystemType, { like_for_like: number; upgrade: number | null; upgrade_label: string | null }> = {
  water_heater: { like_for_like: 2200, upgrade: 4800, upgrade_label: 'Heat pump water heater' },
  hvac: { like_for_like: 9500, upgrade: 14500, upgrade_label: 'Heat pump HVAC' },
  electrical_panel: { like_for_like: 3500, upgrade: 5200, upgrade_label: '200A panel + EV/heat-pump ready' },
  roof_invoice: { like_for_like: 16000, upgrade: null, upgrade_label: null },
};

// IRA + utility rebate amounts. Conservative defaults for the demo.
const REBATES: Record<SystemType, { ira_upgrade: number; pge_upgrade: number; bayren_upgrade: number }> = {
  water_heater: { ira_upgrade: 2000, pge_upgrade: 1000, bayren_upgrade: 300 },
  hvac: { ira_upgrade: 2000, pge_upgrade: 1000, bayren_upgrade: 1000 },
  electrical_panel: { ira_upgrade: 600, pge_upgrade: 0, bayren_upgrade: 750 },
  roof_invoice: { ira_upgrade: 0, pge_upgrade: 0, bayren_upgrade: 0 },
};

function statusForRemainingLife(remaining_years: number | null): SystemForecast['status'] {
  if (remaining_years === null) return 'unknown';
  if (remaining_years <= 0) return 'overdue';
  if (remaining_years <= 1) return 'due_soon';
  if (remaining_years <= 3) return 'watch';
  return 'ok';
}

function buildOption(
  label: string,
  base: number,
  rebates: { ira: number; pge: number; bayren: number },
  isUpgrade: boolean
): ReplacementOption {
  const total_rebates = rebates.ira + rebates.pge + rebates.bayren;
  return {
    label,
    base_cost_usd: base,
    ira_credit_usd: rebates.ira,
    pge_rebate_usd: rebates.pge,
    bayren_rebate_usd: rebates.bayren,
    net_cost_usd: Math.max(0, base - total_rebates),
    is_upgrade: isUpgrade,
    rebate_eligible: total_rebates > 0,
  };
}

export function forecastSystem(record: SystemRecord): SystemForecast {
  const lifespan = record.expected_lifespan_years ?? DEFAULT_LIFESPAN[record.system_type];
  const age = record.estimated_age_years;
  const remaining = age !== null ? lifespan - age : null;
  const status = statusForRemainingLife(remaining);
  const costs = REPLACEMENT_COSTS[record.system_type];
  const rebates = REBATES[record.system_type];

  const like_for_like = buildOption(
    'Direct replacement',
    costs.like_for_like,
    { ira: 0, pge: 0, bayren: 0 },
    false
  );

  const upgrade =
    costs.upgrade !== null && costs.upgrade_label
      ? buildOption(
          costs.upgrade_label,
          costs.upgrade,
          { ira: rebates.ira_upgrade, pge: rebates.pge_upgrade, bayren: rebates.bayren_upgrade },
          true
        )
      : null;

  return {
    system_type: record.system_type,
    status,
    due_window_months: remaining !== null ? Math.max(0, Math.round(remaining * 12)) : null,
    current_age_years: age,
    expected_lifespan_years: lifespan,
    like_for_like,
    upgrade,
  };
}

// What's-Next bucket assignment.
export type TimelineBucket = '30d' | '6m' | '1y' | '5y';
export const TIMELINE_LABELS: Record<TimelineBucket, string> = {
  '30d': 'Next 30 days',
  '6m': '6 months',
  '1y': '1 year',
  '5y': '2–5 years',
};
export const TIMELINE_ORDER: TimelineBucket[] = ['30d', '6m', '1y', '5y'];

export function bucketFor(forecast: SystemForecast): TimelineBucket | null {
  if (forecast.due_window_months === null) return null;
  if (forecast.due_window_months <= 1) return '30d';
  if (forecast.due_window_months <= 6) return '6m';
  if (forecast.due_window_months <= 12) return '1y';
  if (forecast.due_window_months <= 60) return '5y';
  return null;
}

export type MoneyPlan = {
  next_12mo_total_usd: number;
  next_12mo_with_upgrades_usd: number;
  total_rebates_unlocked_usd: number;
  items: Array<{
    system_type: SystemType;
    label: string;
    base_cost_usd: number;
    net_cost_usd: number;
    rebates_unlocked_usd: number;
    is_upgrade: boolean;
    window_months: number;
  }>;
};

export function computeMoneyPlan(forecasts: SystemForecast[]): MoneyPlan {
  const upcoming = forecasts.filter(
    (f) => f.due_window_months !== null && f.due_window_months <= 12
  );

  const items = upcoming.map((f) => {
    const option = f.upgrade ?? f.like_for_like;
    return {
      system_type: f.system_type,
      label: option.label,
      base_cost_usd: option.base_cost_usd,
      net_cost_usd: option.net_cost_usd,
      rebates_unlocked_usd: option.base_cost_usd - option.net_cost_usd,
      is_upgrade: option.is_upgrade,
      window_months: f.due_window_months ?? 12,
    };
  });

  const next_12mo_total_usd = items.reduce((sum, i) => sum + i.base_cost_usd, 0);
  const next_12mo_with_upgrades_usd = items.reduce((sum, i) => sum + i.net_cost_usd, 0);
  const total_rebates_unlocked_usd = items.reduce((sum, i) => sum + i.rebates_unlocked_usd, 0);

  return {
    next_12mo_total_usd,
    next_12mo_with_upgrades_usd,
    total_rebates_unlocked_usd,
    items,
  };
}

// Composite health score (0-100). Weighted by system count + remaining life.
export function computeHealthScore(
  forecasts: SystemForecast[],
  documented_count: number,
  total_systems: number
): { score: number; documentation_pct: number } {
  const documentation_pct = total_systems > 0 ? Math.round((documented_count / total_systems) * 100) : 0;
  if (forecasts.length === 0) {
    // No data → score reflects only the documentation effort.
    return { score: Math.round(documentation_pct * 0.4), documentation_pct };
  }
  const perSystem = forecasts.map((f) => {
    if (f.due_window_months === null) return 60; // unknown but present
    if (f.due_window_months <= 0) return 25; // overdue
    if (f.due_window_months <= 6) return 50;
    if (f.due_window_months <= 12) return 70;
    if (f.due_window_months <= 60) return 85;
    return 95;
  });
  const avg = perSystem.reduce((a, b) => a + b, 0) / perSystem.length;
  // Penalize missing documentation up to -20 points.
  const documentationPenalty = (1 - documented_count / total_systems) * 20;
  return {
    score: Math.max(0, Math.min(100, Math.round(avg - documentationPenalty))),
    documentation_pct,
  };
}

export function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
