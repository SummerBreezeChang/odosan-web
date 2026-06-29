import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

/**
 * POST /api/home-record/clear
 *
 * Wipe every saved brief for the signed-in user. Used by the demo-only
 * "Reset demo data" button on /my-home so retakes between recordings
 * always start from a clean Aurora state (in addition to localStorage).
 * 401 for anon callers — no-op is fine, local-only wipe still runs.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }
    const userId = session.user.id;

    const result = await sql`
      DELETE FROM user_home_briefs WHERE user_id = ${userId}
    `;

    return Response.json({
      cleared: true,
      // sql template may return a result with rowCount on some drivers.
      rowsAffected: (result as unknown as { rowCount?: number })?.rowCount ?? null,
    });
  } catch (error) {
    console.error('[/api/home-record/clear POST error]', error);
    return Response.json({ error: 'Failed to clear home record' }, { status: 500 });
  }
}
