import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

/**
 * POST /api/save-home — link the signed-in homeowner to a parcel.
 * Body: { parcel_id }. Idempotent (UNIQUE constraint on (user_id, parcel_id)).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }

    const body = await request.json();
    const parcelId = (body?.parcel_id as string)?.trim();
    if (!parcelId) {
      return Response.json({ error: 'parcel_id is required' }, { status: 400 });
    }

    // Verify the parcel exists
    const check = await sql<{ parcel_id: string }>`
      SELECT parcel_id FROM home_profiles WHERE parcel_id = ${parcelId} LIMIT 1
    `;
    if (check.length === 0) {
      return Response.json({ error: 'Home profile not found' }, { status: 404 });
    }

    await sql`
      INSERT INTO homeowner_homes (user_id, parcel_id)
      VALUES (${session.user.id}, ${parcelId})
      ON CONFLICT (user_id, parcel_id) DO NOTHING
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[/api/save-home error]', error);
    return Response.json({ error: 'Failed to save home' }, { status: 500 });
  }
}

/**
 * DELETE /api/save-home?parcel_id=APN — unsave.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }
    const parcelId = request.nextUrl.searchParams.get('parcel_id')?.trim();
    if (!parcelId) return Response.json({ error: 'parcel_id is required' }, { status: 400 });

    await sql`
      DELETE FROM homeowner_homes
      WHERE user_id = ${session.user.id} AND parcel_id = ${parcelId}
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[/api/save-home DELETE error]', error);
    return Response.json({ error: 'Failed to remove home' }, { status: 500 });
  }
}
