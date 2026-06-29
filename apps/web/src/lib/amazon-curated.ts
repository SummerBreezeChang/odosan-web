/**
 * Curated Amazon DIY parts catalog.
 *
 * Renders as fallback when the Amazon Creators API is gated (new accounts
 * are blocked until activation + 10 qualifying sales). Each entry links
 * to a category- and product-specific Amazon search URL that's
 * affiliate-tagged with AMAZON_ASSOCIATE_TAG — click-throughs are still
 * properly attributed even before the product-data API unlocks.
 *
 * When the Creators API starts returning real items, the API route
 * prefers those and ignores this catalog. No code change needed at unlock.
 */

export type CuratedCategory =
  | 'water_heater'
  | 'hvac'
  | 'plumbing'
  | 'disposal'
  | 'electrical'
  | 'roofing'
  | 'general';

export type CuratedIcon =
  | 'wrench'
  | 'droplet'
  | 'wind'
  | 'plug'
  | 'home'
  | 'thermometer'
  | 'shield'
  | 'box';

export type CuratedProduct = {
  id: string;
  title: string;
  description: string;
  priceRange: string;
  searchKeywords: string;
  category: CuratedCategory;
  icon: CuratedIcon;
};

const CATALOG: CuratedProduct[] = [
  // ─── Water heater ──────────────────────────────────────────────────────
  {
    id: 'wh-anode',
    title: 'Magnesium Anode Rod (universal)',
    description: 'Highest-impact maintenance part. Replacing it every 4–5 years adds 5+ years to your tank.',
    priceRange: '$25–40',
    searchKeywords: 'water heater magnesium anode rod universal',
    category: 'water_heater',
    icon: 'wrench',
  },
  {
    id: 'wh-tpr',
    title: 'T&P relief valve replacement',
    description: 'Test annually. If it weeps or seizes, swap it — code part, ~10 min job.',
    priceRange: '$15–25',
    searchKeywords: 'water heater T&P pressure relief valve',
    category: 'water_heater',
    icon: 'droplet',
  },
  {
    id: 'wh-flush',
    title: 'Sediment flush kit (hose + brass valve)',
    description: 'Annual flush keeps the burner efficient and prevents rumbling.',
    priceRange: '$20–35',
    searchKeywords: 'water heater drain valve brass flush kit',
    category: 'water_heater',
    icon: 'box',
  },

  // ─── HVAC ──────────────────────────────────────────────────────────────
  {
    id: 'hvac-filter',
    title: 'MERV 13 furnace filter — 6 pack',
    description: 'Captures dust, pollen, and smoke particles. Replace every 90 days.',
    priceRange: '$35–55',
    searchKeywords: 'MERV 13 furnace filter 16x25x1 6 pack',
    category: 'hvac',
    icon: 'wind',
  },
  {
    id: 'hvac-coil-cleaner',
    title: 'Foaming condenser-coil cleaner',
    description: 'No-rinse spray lifts grime off outdoor AC coils. Use once per cooling season.',
    priceRange: '$15–25',
    searchKeywords: 'foaming AC condenser coil cleaner no rinse',
    category: 'hvac',
    icon: 'droplet',
  },
  {
    id: 'hvac-thermostat',
    title: 'Smart programmable thermostat',
    description: 'Schedules cut runtime ~10–15%. Pays back in one or two seasons.',
    priceRange: '$80–130',
    searchKeywords: 'smart programmable thermostat WiFi',
    category: 'hvac',
    icon: 'thermometer',
  },

  // ─── Garbage disposal ──────────────────────────────────────────────────
  // Split out from generic plumbing because a disposal leak has a very
  // specific failure tree (splash guard / sink flange / motor seal /
  // mounting) — the demo diagnose preset lands here and the products
  // need to visually match the splash-guard recommendation, not the
  // generic plumbing kit.
  {
    id: 'disposal-splash-baffle',
    title: 'InSinkErator splash baffle (Badger / Evolution)',
    description: 'The black rubber boot at the top of the disposal — universal fit for Badger 5. Twist out, drop in, done in a minute.',
    priceRange: '$8–15',
    searchKeywords: 'InSinkErator splash baffle Badger 5 rubber boot',
    category: 'disposal',
    icon: 'droplet',
  },
  {
    id: 'disposal-mounting-kit',
    title: 'Disposal sink-flange mounting kit',
    description: 'If the disposal wiggles or weeps at the top, the sink flange needs reseating. Includes flange, snap ring, and gasket.',
    priceRange: '$15–25',
    searchKeywords: 'garbage disposal sink flange mounting kit gasket',
    category: 'disposal',
    icon: 'wrench',
  },
  {
    id: 'disposal-wrenchette',
    title: 'Disposal wrenchette (1/4″ hex)',
    description: 'The free fix — unjams a stuck disposal from below without removing it. Most Badger 5 issues start here before they need parts.',
    priceRange: '$5–10',
    searchKeywords: 'garbage disposal wrenchette hex jam tool',
    category: 'disposal',
    icon: 'box',
  },

  // ─── Plumbing ──────────────────────────────────────────────────────────
  {
    id: 'plumb-ptrap',
    title: 'PVC P-trap kit (1.5″)',
    description: 'Standard slip-joint sink trap. No glue, no plumber.',
    priceRange: '$8–15',
    searchKeywords: 'PVC P-trap kit 1.5 inch slip joint',
    category: 'plumbing',
    icon: 'wrench',
  },
  {
    id: 'plumb-snake',
    title: 'Hand drain snake (25 ft)',
    description: 'Clears most kitchen and bath drains without harsh chemicals.',
    priceRange: '$20–35',
    searchKeywords: 'hand drain snake 25 ft drum auger',
    category: 'plumbing',
    icon: 'wrench',
  },
  {
    id: 'plumb-fill-valve',
    title: 'Fluidmaster toilet fill valve',
    description: 'Drop-in fix for a running toilet. Quiet, code-compliant, ~15 min install.',
    priceRange: '$12–20',
    searchKeywords: 'Fluidmaster 400A toilet fill valve',
    category: 'plumbing',
    icon: 'droplet',
  },

  // ─── Electrical ────────────────────────────────────────────────────────
  {
    id: 'elec-surge',
    title: 'Whole-house surge protector (Type 2)',
    description: 'Panel-mounted. Protects everything downstream from voltage spikes.',
    priceRange: '$80–130',
    searchKeywords: 'whole house surge protector type 2 panel',
    category: 'electrical',
    icon: 'shield',
  },
  {
    id: 'elec-tester',
    title: 'Non-contact voltage tester',
    description: 'Always test before you touch a wire. Pen-style, 50–1000 V.',
    priceRange: '$15–25',
    searchKeywords: 'non contact voltage tester pen 50 1000V',
    category: 'electrical',
    icon: 'plug',
  },
  {
    id: 'elec-gfci',
    title: 'Tamper-resistant GFCI outlet (15 A)',
    description: 'Code-required in kitchens, baths, garages, outdoors.',
    priceRange: '$15–25',
    searchKeywords: 'GFCI outlet tamper resistant 15 amp',
    category: 'electrical',
    icon: 'plug',
  },

  // ─── Roofing ───────────────────────────────────────────────────────────
  {
    id: 'roof-sealant',
    title: 'Roof flashing sealant (UV-stable)',
    description: 'For pinhole leaks around vents and flashing. Single tube covers most repairs.',
    priceRange: '$10–20',
    searchKeywords: 'roof flashing sealant tube UV stable',
    category: 'roofing',
    icon: 'home',
  },
  {
    id: 'roof-gutter-guard',
    title: 'Mesh gutter guard (50 ft)',
    description: 'Snap-in mesh keeps leaves out. Annual cleanings become biennial.',
    priceRange: '$40–70',
    searchKeywords: 'mesh gutter guard 50 ft snap in',
    category: 'roofing',
    icon: 'home',
  },

  // ─── General handyman ──────────────────────────────────────────────────
  {
    id: 'gen-multitool',
    title: 'Homeowner essentials toolkit (140-piece)',
    description: 'The kit you keep under the sink. Covers most quick fixes.',
    priceRange: '$40–80',
    searchKeywords: 'homeowner tool kit 140 piece',
    category: 'general',
    icon: 'wrench',
  },
];

function detectCategory(query: string): CuratedCategory {
  const q = query.toLowerCase();
  // Disposal must be checked BEFORE plumbing — 'garbage disposal' would
  // otherwise fall into the plumbing bucket and return P-trap / drain
  // snake / fill valve, none of which fix a disposal leak.
  if (/(disposal|splash guard|splash baffle|badger|insinkerator)/.test(q)) return 'disposal';
  if (/(water heater|anode|tankless|t&p|water tank|hot water)/.test(q)) return 'water_heater';
  if (/(hvac|furnace|\bac\b|condenser|thermostat|filter|merv|air handler|heat pump)/.test(q)) return 'hvac';
  if (/(plumb|p.?trap|drain|faucet|toilet|leak|pipe|fill valve)/.test(q)) return 'plumbing';
  if (/(electr|breaker|panel|outlet|surge|gfci|wire|voltage)/.test(q)) return 'electrical';
  if (/(roof|gutter|shingle|flashing|downspout)/.test(q)) return 'roofing';
  return 'general';
}

/**
 * Return curated products that match the query's category, up to `max`.
 * If nothing matches the detected category, falls back to general.
 */
export function matchCuratedProducts(query: string, max = 3): CuratedProduct[] {
  const category = detectCategory(query);
  let pool = CATALOG.filter((p) => p.category === category);
  if (pool.length === 0) {
    pool = CATALOG.filter((p) => p.category === 'general');
  }
  return pool.slice(0, max);
}

/**
 * Build an affiliate-tagged Amazon search URL for a curated product.
 * Returns null if no partner tag is configured.
 */
export function buildCuratedProductUrl(
  product: CuratedProduct,
  partnerTag: string | undefined,
  marketplace = 'www.amazon.com'
): string | null {
  if (!partnerTag) return null;
  const params = new URLSearchParams({ k: product.searchKeywords, tag: partnerTag });
  return `https://${marketplace}/s?${params.toString()}`;
}
