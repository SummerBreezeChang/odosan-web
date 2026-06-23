// Canonical trade-category mapping. Keep this in sync with the diagnose
// form's category picker (apps/web/src/app/(app)/diagnose/page.tsx) and
// the provider seed data (apps/web/src/app/api/seed-providers/route.ts).
//
// `my-home` uses its own SHORT labels (Plumbing, Gutters, etc.) for tile
// chrome — that's intentional, don't merge those here.

export const CATEGORY_LABELS: Record<string, string> = {
  plumbing_drainage: 'Plumbing & Drainage',
  gutters_drainage: 'Gutters & Drainage',
  landscaping: 'Landscaping & Yard',
  roofing: 'Roofing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  pest_control: 'Pest Control',
  handyman: 'Handyman',
  painting: 'Painting',
  other: 'Other / not sure',
};

export function categoryLabel(id: string | null | undefined): string {
  if (!id) return '';
  return CATEGORY_LABELS[id] ?? id;
}
