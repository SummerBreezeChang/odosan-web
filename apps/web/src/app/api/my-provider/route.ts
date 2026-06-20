import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

type MyProvider = {
  provider_id: string;
  name: string;
  category: string;
  phone: string;
  areas_served: string[];
  rating: number | null;
  verification_status: string;
};

/**
 * GET /api/my-provider — returns the signed-in user's claimed provider row,
 * or { provider: null } if they haven't claimed one yet (sends them to
 * /account/claim-provider in the UI).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }

    const rows = await sql<MyProvider>`
      SELECT p.provider_id, p.name, p.category, p.phone,
             p.areas_served, p.rating::float, p.verification_status
      FROM provider_users pu
      JOIN providers p ON p.provider_id = pu.provider_id
      WHERE pu.user_id = ${session.user.id}
      LIMIT 1
    `;

    return Response.json({ provider: rows[0] ?? null });
  } catch (error) {
    console.error('[/api/my-provider error]', error);
    return Response.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}
