import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

/**
 * POST /api/home-record/migrate — bulk-insert anonymous localStorage data
 * into the signed-in user's home record on first sign-up / sign-in.
 *
 * Body: { briefs: DiagnosisBrief[], systems: SystemRecord[] }
 *
 * Each individual insert is best-effort — a failed brief doesn't block others.
 * Systems are upserted (latest per system_type wins).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const briefs = Array.isArray(body?.briefs) ? body.briefs : [];
    const systems = Array.isArray(body?.systems) ? body.systems : [];

    let briefsInserted = 0;
    let systemsInserted = 0;

    for (const b of briefs) {
      try {
        await sql`
          INSERT INTO user_home_briefs (
            user_id, category, neighborhood, issue, severity, scope_of_work,
            fair_price_range, diy_or_pro, explanation, confidence, diy_shopping_query
          ) VALUES (
            ${userId}, ${b.category ?? ''}, ${b.neighborhood ?? ''},
            ${b.issue ?? ''}, ${b.severity ?? 'monitor'},
            ${b.scopeOfWork ?? ''}, ${b.fairPriceRange ?? ''},
            ${b.diyOrPro ?? 'pro'}, ${b.explanation ?? ''},
            ${typeof b.confidence === 'number' ? b.confidence : 0},
            ${b.diyShoppingQuery ?? ''}
          )
        `;
        briefsInserted++;
      } catch (err) {
        console.error('[migrate brief skipped]', err);
      }
    }

    for (const s of systems) {
      try {
        await sql`
          INSERT INTO user_home_systems (
            user_id, system_type, make, model, serial, install_date,
            manufacture_date, capacity, fuel_or_type, estimated_age_years,
            expected_lifespan_years, notes, recall_or_safety_flag, confidence, raw_text
          ) VALUES (
            ${userId}, ${s.system_type}, ${s.make ?? null}, ${s.model ?? null},
            ${s.serial ?? null}, ${s.install_date ?? null},
            ${s.manufacture_date ?? null}, ${s.capacity ?? null},
            ${s.fuel_or_type ?? null},
            ${typeof s.estimated_age_years === 'number' ? s.estimated_age_years : null},
            ${typeof s.expected_lifespan_years === 'number' ? s.expected_lifespan_years : null},
            ${s.notes ?? null}, ${s.recall_or_safety_flag ?? null},
            ${typeof s.confidence === 'number' ? s.confidence : 0},
            ${s.raw_text ?? ''}
          )
          ON CONFLICT (user_id, system_type) DO UPDATE SET
            make = EXCLUDED.make,
            model = EXCLUDED.model,
            serial = EXCLUDED.serial,
            install_date = EXCLUDED.install_date,
            manufacture_date = EXCLUDED.manufacture_date,
            capacity = EXCLUDED.capacity,
            fuel_or_type = EXCLUDED.fuel_or_type,
            estimated_age_years = EXCLUDED.estimated_age_years,
            expected_lifespan_years = EXCLUDED.expected_lifespan_years,
            notes = EXCLUDED.notes,
            recall_or_safety_flag = EXCLUDED.recall_or_safety_flag,
            confidence = EXCLUDED.confidence,
            raw_text = EXCLUDED.raw_text,
            documented_at = now()
        `;
        systemsInserted++;
      } catch (err) {
        console.error('[migrate system skipped]', err);
      }
    }

    return Response.json({ briefsInserted, systemsInserted });
  } catch (error) {
    console.error('[/api/home-record/migrate POST error]', error);
    return Response.json({ error: 'Migration failed' }, { status: 500 });
  }
}
