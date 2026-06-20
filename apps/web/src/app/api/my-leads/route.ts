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
        l.lead_id, l.category, l.problem, l.scope, l.fair_price_range,
        l.severity, l.neighborhood, l.status, l.created_at,
        COUNT(q.id)::int AS quote_count,
        MIN(q.amount_low)::float AS min_low,
        MAX(q.amount_high)::float AS max_high
      FROM leads l
      LEFT JOIN lead_quotes q ON q.lead_id = l.lead_id
      WHERE l.homeowner_user_id = ${session.user.id}
      GROUP BY l.lead_id
      ORDER BY l.created_at DESC
      LIMIT 50
    `;

    return Response.json({ leads: rows });
  } catch (error) {
    console.error('[/api/my-leads error]', error);
    return Response.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
