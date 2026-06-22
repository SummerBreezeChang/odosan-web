/**
 * Turns extracted nameplate fields into Amazon search queries.
 *
 * Two buckets per system:
 *  - extend: high-intent DIY maintenance parts that don't cannibalize provider leads
 *  - replace: full units, framed as price reference under a provider-quote CTA
 */

export type SystemType = 'water_heater' | 'hvac' | 'electrical_panel' | 'roof_invoice';

export type Extracted = {
  system_type: SystemType;
  make: string | null;
  model: string | null;
  capacity: string | null;
  fuel_or_type: string | null;
};

export type QuerySet = {
  extend: { keywords: string; searchIndex: string } | null;
  replace: { keywords: string; searchIndex: string } | null;
};

export function buildQueries(e: Extracted): QuerySet {
  const make = (e.make ?? '').trim();
  const capacity = (e.capacity ?? '').trim();
  const fuel = (e.fuel_or_type ?? '').trim();

  switch (e.system_type) {
    case 'water_heater': {
      // Extend: anode rod is the single highest-impact maintenance item.
      const extendKeywords = make
        ? `${make} water heater anode rod`
        : `water heater anode rod magnesium`;
      // Replace: capacity + fuel narrows it dramatically.
      const replaceKeywords = [capacity || '50 gallon', fuel || '', 'water heater']
        .filter(Boolean)
        .join(' ');
      return {
        extend: { keywords: extendKeywords, searchIndex: 'Tools' },
        replace: { keywords: replaceKeywords, searchIndex: 'Appliances' },
      };
    }

    case 'hvac': {
      // Extend: filters are the universal high-frequency purchase.
      const extendKeywords = `MERV 11 furnace filter 16x25x1`; // safe default size; refine when we capture filter size in nameplate
      // Replace: full condensers are rarely retail-purchased; show capacity + brand for reference.
      const replaceKeywords = [capacity || '3 ton', make || '', 'AC condenser']
        .filter(Boolean)
        .join(' ');
      return {
        extend: { keywords: extendKeywords, searchIndex: 'HomeImprovement' },
        replace: { keywords: replaceKeywords, searchIndex: 'HomeImprovement' },
      };
    }

    case 'electrical_panel': {
      // Extend: whole-house surge protector is the safest, highest-value add for any panel.
      const extendKeywords = make
        ? `${make} whole house surge protector`
        : `whole house surge protector type 2`;
      // "Replace" for panels = service upgrade, not a retail product. Show subpanel kits as reference only.
      const replaceKeywords = `200 amp main breaker panel ${make || ''}`.trim();
      return {
        extend: { keywords: extendKeywords, searchIndex: 'HomeImprovement' },
        replace: { keywords: replaceKeywords, searchIndex: 'HomeImprovement' },
      };
    }

    case 'roof_invoice': {
      // Extend: roof maintenance kit + gutter guards are the homeowner-DIYable items.
      const extendKeywords = `roof sealant flashing repair kit`;
      // No retail roof replacement product — skip the replace bucket and let the provider CTA carry it.
      return {
        extend: { keywords: extendKeywords, searchIndex: 'HomeImprovement' },
        replace: null,
      };
    }

    default:
      return { extend: null, replace: null };
  }
}
