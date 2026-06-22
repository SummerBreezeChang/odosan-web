import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

/**
 * POST /api/home-record/system — upsert a scanned system into the signed-in
 * user's home record. Latest scan per system_type wins (matches localStorage).
 *
 * Body: { system_type, make, model, serial, install_date, manufacture_date,
 *         capacity, fuel_or_type, estimated_age_years, expected_lifespan_years,
 *         notes, recall_or_safety_flag, confidence, raw_text,
 *         photo_s3_bucket, photo_s3_key, photo_s3_region }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    if (!body?.system_type) {
      return Response.json({ error: 'system_type is required' }, { status: 400 });
    }

    const rows = await sql<{ id: string; documented_at: string }>`
      INSERT INTO user_home_systems (
        user_id, system_type, make, model, serial, install_date,
        manufacture_date, capacity, fuel_or_type, estimated_age_years,
        expected_lifespan_years, notes, recall_or_safety_flag, confidence,
        raw_text, photo_s3_bucket, photo_s3_key, photo_s3_region
      ) VALUES (
        ${userId}, ${body.system_type}, ${body.make ?? null}, ${body.model ?? null},
        ${body.serial ?? null}, ${body.install_date ?? null},
        ${body.manufacture_date ?? null}, ${body.capacity ?? null},
        ${body.fuel_or_type ?? null},
        ${typeof body.estimated_age_years === 'number' ? body.estimated_age_years : null},
        ${typeof body.expected_lifespan_years === 'number' ? body.expected_lifespan_years : null},
        ${body.notes ?? null}, ${body.recall_or_safety_flag ?? null},
        ${typeof body.confidence === 'number' ? body.confidence : 0},
        ${body.raw_text ?? ''}, ${body.photo_s3_bucket ?? null},
        ${body.photo_s3_key ?? null}, ${body.photo_s3_region ?? null}
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
        photo_s3_bucket = EXCLUDED.photo_s3_bucket,
        photo_s3_key = EXCLUDED.photo_s3_key,
        photo_s3_region = EXCLUDED.photo_s3_region,
        documented_at = now()
      RETURNING id, documented_at
    `;

    return Response.json({ id: rows[0]?.id, documented_at: rows[0]?.documented_at });
  } catch (error) {
    console.error('[/api/home-record/system POST error]', error);
    return Response.json({ error: 'Failed to save system' }, { status: 500 });
  }
}
