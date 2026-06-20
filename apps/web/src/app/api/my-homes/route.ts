import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }

    const rows = await sql`
      SELECT
        h.parcel_id, h.address, h.zip, h.year_built,
        h.systems, h.solar, h.top_needs,
        hh.saved_at
      FROM homeowner_homes hh
      JOIN home_profiles h ON h.parcel_id = hh.parcel_id
      WHERE hh.user_id = ${session.user.id}
      ORDER BY hh.saved_at DESC
    `;

    return Response.json({ homes: rows });
  } catch (error) {
    console.error('[/api/my-homes error]', error);
    return Response.json({ error: 'Failed to fetch saved homes' }, { status: 500 });
  }
}
