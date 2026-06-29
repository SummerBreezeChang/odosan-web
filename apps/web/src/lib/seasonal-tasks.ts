/**
 * Seasonal home-maintenance tasks shown on /my-home Seasonal tab and the
 * /my-home/seasonal/[slug] detail pages. Each task has both a card summary
 * (for the tab grid) and a richer body (for the detail page) so the
 * homeowner has enough context to know what they're looking for before
 * they walk into the diagnose flow.
 */

import {
  CloudRain,
  Droplet,
  Home,
  Wind,
  type LucideIcon,
} from 'lucide-react';

export type SeasonalTask = {
  /** URL slug used in /my-home/seasonal/[slug]. */
  id: string;
  /** Card title — short, two-line max. */
  title: string;
  /** Card subtitle — frequency or trigger ("Before fall rains"). */
  when: string;
  /** Card body — one-line "why this matters". */
  shortWhy: string;
  /** Maps to the diagnose-page category id (used by the detail-page CTA). */
  category: string;
  /** Lucide icon component for the visual. */
  icon: LucideIcon;
  /** Detail-page opening paragraph (1–2 short paragraphs of plain-words context). */
  intro: string;
  /** Bullet list of what the homeowner should grab before they start. */
  toolsNeeded: string[];
  /** Numbered list — the basic procedure in 3–5 steps. */
  basics: string[];
  /** Bullet list of red flags that mean call a pro, not DIY. */
  watchFor: string[];
  /** What kind of photo to take when diagnosing. Shown above the CTA. */
  diagnoseHint: string;
};

export const SEASONAL_TASKS: SeasonalTask[] = [
  {
    id: 'gutter-cleaning',
    title: 'Gutter cleaning',
    when: 'Before fall rains',
    shortWhy:
      'Clogged gutters back water up at the foundation — the #1 cause of basement leaks.',
    category: 'gutters_drainage',
    icon: CloudRain,
    intro:
      "Your gutters move thousands of gallons of water away from the house every winter. When leaves and seed pods pack into the downspouts, that water has nowhere to go — it pours over the edge, soaks the soil right next to the foundation, and finds its way into the basement or crawlspace.\n\nEast Bay live oaks drop year-round, so an October cleaning is the minimum. If you have a redwood or eucalyptus overhead, do it twice — September and December.",
    toolsNeeded: [
      'Sturdy extension ladder (not a step ladder)',
      'Work gloves',
      'A small trowel or gutter scoop',
      'A bucket on a ladder hook',
      'Garden hose with a sprayer attachment',
    ],
    basics: [
      'Place the ladder on flat ground; brace it against a roof anchor, never the gutter itself.',
      'Scoop debris into the bucket. Work 4-foot sections — don’t lean past the rails.',
      'Hose each section from the high end toward the downspout and watch the water flow.',
      'If the downspout is slow, tap the side of it and re-hose. Stubborn clogs may need a plumber’s snake from the bottom.',
    ],
    watchFor: [
      'Water spilling over the back of the gutter near the fascia — the gutter is pitched wrong, call a pro to re-hang.',
      'A mid-span sag — a hidden hanger has failed.',
      'Dirt or mildew streaks down the siding directly below the gutter — water has been overflowing for a while.',
    ],
    diagnoseHint:
      'Take a photo from a few feet back showing the gutter line, any overflow stains on the siding, or the downspout outlet.',
  },
  {
    id: 'hvac-filter',
    title: 'HVAC filter swap',
    when: 'Quarterly',
    shortWhy:
      'A clogged filter cuts efficiency ~15% and shortens the unit’s life.',
    category: 'hvac',
    icon: Wind,
    intro:
      "The filter on your furnace or air handler is the single highest-leverage maintenance task in your house. A clogged one makes the blower work harder, runs up your bill, and drags warm or cool air past the heat exchanger faster than it can do its job.\n\nThe Bay Area doesn't have brutal heat or cold, so a 3-month cycle is plenty for most homes. Every month if you have pets or someone with allergies. Always swap before heating season kicks in.",
    toolsNeeded: [
      'A new filter — check the size printed on the side of the old one (e.g. 16×25×1)',
      'A sharpie to write the install date on the new filter',
      'A flashlight (the filter slot is often tucked behind the unit)',
    ],
    basics: [
      'Turn the thermostat off so the blower isn’t pulling debris when you open the slot.',
      'Slide the old filter out — note the airflow arrow printed on the side.',
      'Slide the new filter in with the arrow pointing toward the unit.',
      'Write today’s date on the new filter with the sharpie. Set a reminder for 90 days.',
    ],
    watchFor: [
      'The old filter is gray after 30 days — too-low MERV or there’s dust ingress, get a pro to check ductwork seams.',
      'The blower runs constantly without cycling off — control board or thermostat issue, not a filter problem.',
      'Loud rattle when the blower kicks on — the blower wheel may be off-balance, schedule a tune-up.',
    ],
    diagnoseHint:
      'Photo of the old filter (showing the color and dust level) or a photo of the nameplate on the air handler so Odosan can identify the unit.',
  },
  {
    id: 'water-heater-flush',
    title: 'Water heater flush',
    when: 'Annual',
    shortWhy:
      'Sediment hardens at the bottom, kills capacity, and rumbles when the burner fires.',
    category: 'plumbing_drainage',
    icon: Droplet,
    intro:
      "Every gallon of municipal water carries tiny minerals. Over a year they settle at the bottom of your tank as a crusty layer that insulates the burner from the water it's trying to heat — so the burner runs longer, your bill goes up, and the layer eventually cracks the tank from the inside.\n\nAn annual flush takes about 20 minutes and adds years to the tank's life. East Bay water is moderately hard; annual is the right cadence.",
    toolsNeeded: [
      'Garden hose (long enough to reach a drain or outside)',
      'A bucket to catch the first gallon for inspection',
      'A flathead screwdriver (some drain valves have a slot, not a handle)',
    ],
    basics: [
      'Turn the heater to Pilot (gas) or off at the breaker (electric).',
      'Shut off the cold water supply at the top. Attach the hose to the drain valve at the bottom and run it to a drain or outside.',
      'Open the drain valve and a hot water tap upstairs to break the vacuum. Let it run until the water at the hose end runs clear — usually 10–15 min.',
      'Close the drain valve, remove the hose, turn the cold supply back on, wait for the upstairs tap to run at full pressure, then re-light the burner.',
    ],
    watchFor: [
      'The drain valve drips after you close it — it’s a $15 part to replace now, or a $250 service call if you wait.',
      'Loud popping or rumbling AFTER a flush — sediment is fused to the tank; may need an anode rod replacement or a new tank.',
      'Brown or rust-colored water at the outlet — the anode rod is spent; replace it before the tank wall goes.',
    ],
    diagnoseHint:
      'Photo of the water heater nameplate (top sticker). Odosan can read the brand, model, and install year and tell you exactly which anode rod fits.',
  },
  {
    id: 'roof-inspection',
    title: 'Roof inspection',
    when: 'Annual',
    shortWhy:
      'Catch a slipped shingle or cracked flashing before a leak finds your ceiling.',
    category: 'roofing',
    icon: Home,
    intro:
      "You don't need to climb up there. An annual ground-level walk-around with binoculars (or your phone's zoom camera) catches 80% of issues.\n\nThe Bay Area's rains arrive in October-November and stay through April. Anything you spot in September has weeks to be fixed before the first storm. Anything you find in January is going to be wet, complicated, and expensive.",
    toolsNeeded: [
      'Binoculars or a phone with a good zoom camera',
      'A notes app — log what you see by side of the house',
      '(Optional) a flashlight to peek into the attic on a sunny day',
    ],
    basics: [
      'Walk the perimeter of the house. Look at the roof-line edge: do shingles lay flat? Any gaps?',
      'Look at any chimney, vent pipe, or skylight: is the flashing tight, no cracked sealant?',
      'Check the gutters from below — are shingle granules collecting in them? That’s the shingle wearing through.',
      'Peek into the attic on a sunny day. Any daylight visible through the deck is a leak waiting to happen.',
    ],
    watchFor: [
      'Curled, cracked, or missing shingles — patching one is easy ($50); patching many means the roof is nearing end of life.',
      'Granules in the gutter (looks like coarse black sand) — shingles are shedding their protective coating.',
      'Mossy or dark streaks on the north-facing slope — common in the East Bay; treat with a zinc strip before moss eats the shingle.',
      'Sagging ridge line — structural, call a roofer immediately.',
    ],
    diagnoseHint:
      'Photo of any spot you’re unsure about — missing shingle, suspect flashing, water stain on the ceiling inside. Odosan compares against common East Bay roof issues.',
  },
  {
    id: 'sump-pump-test',
    title: 'Sump pump test',
    when: 'Before rainy season',
    shortWhy:
      'Pour a bucket in. If it doesn’t pump out, you find out now — not at 3 a.m.',
    category: 'plumbing_drainage',
    icon: Droplet,
    intro:
      "If your house has a basement or a crawlspace below grade, there's a sump pump in the lowest corner whose entire job is to kick on when groundwater rises and pump it out before it floods.\n\nPumps fail sitting unused for 8 dry months. A 60-second test in September tells you whether you'll be calm or panicked the first heavy rain.",
    toolsNeeded: [
      'A 5-gallon bucket of water',
      'A flashlight',
      'Your eyes and ears — you mostly just need to listen and watch',
    ],
    basics: [
      'Lift the lid on the sump basin in the basement or crawlspace. Look for sitting water or visible rust on the pump.',
      'Slowly pour a 5-gallon bucket of water into the basin until the float rises.',
      'Listen — the pump should kick on within a few seconds. Watch the water level drop until the float clicks off.',
      'If the pump hums but doesn’t move water, the impeller is jammed or the check valve is stuck. If it’s silent, it’s dead.',
    ],
    watchFor: [
      'Rust or sludge in the basin — the pump’s intake is clogging, schedule a clean-out.',
      'Discharge water pooling right outside the foundation — the discharge line is too short; that water comes right back in.',
      'Pump cycling on and off rapidly with no rain — basin or check-valve issue, get a plumber in BEFORE the rain.',
    ],
    diagnoseHint:
      'Photo of the sump basin from above, ideally with the lid off, showing the pump and any visible water or rust.',
  },
];

export function findSeasonalTask(slug: string): SeasonalTask | undefined {
  return SEASONAL_TASKS.find((t) => t.id === slug);
}
