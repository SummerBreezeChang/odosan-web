import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const providerId = (body?.provider_id as string)?.trim();
    if (!providerId) {
      return Response.json({ error: 'provider_id is required' }, { status: 400 });
    }

    // Verify provider exists and isn't already claimed
    const check = await sql<{ owner: string | null }>`
      SELECT pu.user_id AS owner
      FROM providers p
      LEFT JOIN provider_users pu ON pu.provider_id = p.provider_id
      WHERE p.provider_id = ${providerId}
    `;
    if (check.length === 0) {
      return Response.json({ error: 'Provider not found' }, { status: 404 });
    }
    if (check[0].owner && check[0].owner !== userId) {
      return Response.json({ error: 'Provider already claimed' }, { status: 409 });
    }

    // Upsert — idempotent if the same user re-claims their own provider
    await sql`
      INSERT INTO provider_users (user_id, provider_id, role)
      VALUES (${userId}, ${providerId}, 'owner')
      ON CONFLICT (user_id) DO UPDATE SET
        provider_id = EXCLUDED.provider_id,
        role        = EXCLUDED.role
    `;

    return Response.json({ ok: true, provider_id: providerId });
  } catch (error) {
    console.error('[/api/claim-provider error]', error);
    return Response.json({ error: 'Failed to claim provider' }, { status: 500 });
  }
}
