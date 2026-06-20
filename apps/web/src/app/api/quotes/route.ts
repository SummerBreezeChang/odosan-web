import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

/**
 * POST /api/quotes — signed-in provider submits an estimate on a lead.
 * Body: { lead_id, amount_low, amount_high, notes? }
 * Upserts on (lead_id, provider_id) so a provider can update their quote.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }

    const body = await request.json();
    const leadId = (body?.lead_id as string)?.trim();
    const low = Number(body?.amount_low);
    const high = Number(body?.amount_high);
    const notes = body?.notes ? String(body.notes).slice(0, 1000) : null;

    if (!leadId) return Response.json({ error: 'lead_id is required' }, { status: 400 });
    if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high < low) {
      return Response.json({ error: 'Invalid amount range' }, { status: 400 });
    }

    // Verify caller has a claimed provider
    const me = await sql<{ provider_id: string; category: string; areas_served: string[] }>`
      SELECT p.provider_id, p.category, p.areas_served
      FROM provider_users pu
      JOIN providers p ON p.provider_id = pu.provider_id
      WHERE pu.user_id = ${session.user.id}
      LIMIT 1
    `;
    if (me.length === 0) {
      return Response.json(
        { error: 'You must claim a provider before submitting estimates.' },
        { status: 403 }
      );
    }

    // Verify the lead exists, is open, and matches the provider's trade + area
    const leadRows = await sql<{
      lead_id: string;
      status: string;
      category: string;
      neighborhood: string;
    }>`
      SELECT lead_id, status, category, neighborhood
      FROM leads
      WHERE lead_id = ${leadId}
      LIMIT 1
    `;
    if (leadRows.length === 0) {
      return Response.json({ error: 'Lead not found' }, { status: 404 });
    }
    const lead = leadRows[0];
    if (lead.status !== 'open') {
      return Response.json({ error: 'Lead is no longer open' }, { status: 409 });
    }
    if (lead.category !== me[0].category) {
      return Response.json({ error: 'Lead trade does not match yours' }, { status: 403 });
    }
    if (!me[0].areas_served.includes(lead.neighborhood)) {
      return Response.json({ error: 'Lead neighborhood is outside your service area' }, { status: 403 });
    }

    await sql`
      INSERT INTO lead_quotes (lead_id, provider_id, amount_low, amount_high, notes, status)
      VALUES (${leadId}, ${me[0].provider_id}, ${low}, ${high}, ${notes}, 'submitted')
      ON CONFLICT (lead_id, provider_id) DO UPDATE SET
        amount_low  = EXCLUDED.amount_low,
        amount_high = EXCLUDED.amount_high,
        notes       = EXCLUDED.notes,
        created_at  = now()
    `;

    return Response.json({ ok: true });
  } catch (error) {
    console.error('[/api/quotes error]', error);
    return Response.json({ error: 'Failed to submit estimate' }, { status: 500 });
  }
}

/**
 * GET /api/quotes?lead_id=... — quotes for a lead (used by homeowner dashboard).
 * Auth: only the lead's homeowner_user_id can read; falls back to "no quotes"
 * for anonymous leads so we never leak provider pricing publicly.
 */
export async function GET(request: NextRequest) {
  try {
    const leadId = request.nextUrl.searchParams.get('lead_id')?.trim();
    if (!leadId) return Response.json({ error: 'lead_id is required' }, { status: 400 });

    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }

    // Confirm caller owns the lead
    const own = await sql<{ owner: string | null }>`
      SELECT homeowner_user_id AS owner FROM leads WHERE lead_id = ${leadId} LIMIT 1
    `;
    if (own.length === 0) return Response.json({ error: 'Lead not found' }, { status: 404 });
    if (own[0].owner !== session.user.id) {
      return Response.json({ error: 'Not your lead' }, { status: 403 });
    }

    const quotes = await sql`
      SELECT q.id, q.amount_low::float, q.amount_high::float, q.notes,
             q.status, q.created_at,
             p.provider_id, p.name AS provider_name, p.rating::float,
             p.phone, p.google_maps_url
      FROM lead_quotes q
      JOIN providers p ON p.provider_id = q.provider_id
      WHERE q.lead_id = ${leadId}
      ORDER BY q.created_at ASC
    `;

    return Response.json({ quotes });
  } catch (error) {
    console.error('[/api/quotes GET error]', error);
    return Response.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}
