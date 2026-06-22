import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

type BriefRow = {
  id: string;
  category: string;
  neighborhood: string;
  issue: string;
  severity: 'urgent' | 'soon' | 'monitor';
  scope_of_work: string;
  fair_price_range: string;
  diy_or_pro: 'diy' | 'pro';
  explanation: string;
  confidence: number;
  diy_shopping_query: string;
  saved_at: string;
};

type SystemRow = {
  id: string;
  system_type: 'water_heater' | 'hvac' | 'electrical_panel' | 'roof_invoice';
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
  photo_s3_bucket: string | null;
  photo_s3_key: string | null;
  photo_s3_region: string | null;
  documented_at: string;
};

/**
 * GET /api/home-record — return the signed-in user's full home record:
 *   { briefs: DiagnosisBrief[], systems: SystemRecord[] }
 *
 * Shapes match lib/home-record.ts so the same UI works with either store.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }
    const userId = session.user.id;

    const [briefRows, systemRows] = await Promise.all([
      sql<BriefRow>`
        SELECT id, category, neighborhood, issue, severity, scope_of_work,
               fair_price_range, diy_or_pro, explanation, confidence,
               diy_shopping_query, saved_at
        FROM user_home_briefs
        WHERE user_id = ${userId}
        ORDER BY saved_at DESC
        LIMIT 50
      `,
      sql<SystemRow>`
        SELECT id, system_type, make, model, serial, install_date,
               manufacture_date, capacity, fuel_or_type, estimated_age_years,
               expected_lifespan_years, notes, recall_or_safety_flag,
               confidence, raw_text, photo_s3_bucket, photo_s3_key,
               photo_s3_region, documented_at
        FROM user_home_systems
        WHERE user_id = ${userId}
        ORDER BY documented_at DESC
      `,
    ]);

    // Reshape to match the localStorage types in lib/home-record.ts
    const briefs = briefRows.map((b) => ({
      id: b.id,
      category: b.category,
      neighborhood: b.neighborhood,
      issue: b.issue,
      severity: b.severity,
      scopeOfWork: b.scope_of_work,
      fairPriceRange: b.fair_price_range,
      diyOrPro: b.diy_or_pro,
      explanation: b.explanation,
      confidence: b.confidence,
      diyShoppingQuery: b.diy_shopping_query,
      saved_at: b.saved_at,
    }));

    const systems = systemRows.map((s) => ({
      id: s.id,
      system_type: s.system_type,
      make: s.make,
      model: s.model,
      serial: s.serial,
      install_date: s.install_date,
      manufacture_date: s.manufacture_date,
      capacity: s.capacity,
      fuel_or_type: s.fuel_or_type,
      estimated_age_years: s.estimated_age_years,
      expected_lifespan_years: s.expected_lifespan_years,
      notes: s.notes,
      recall_or_safety_flag: s.recall_or_safety_flag,
      confidence: s.confidence,
      raw_text: s.raw_text,
      documented_at: s.documented_at,
    }));

    return Response.json({ briefs, systems });
  } catch (error) {
    console.error('[/api/home-record GET error]', error);
    return Response.json({ error: 'Failed to load home record' }, { status: 500 });
  }
}
