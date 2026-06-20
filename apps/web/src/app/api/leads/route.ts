import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      category,
      problem,
      scope,
      fair_price_range,
      severity,
      neighborhood,
      chosen_provider_id,
      photo_keys = [],
    } = body;

    if (!category || !problem || !scope || !fair_price_range || !severity || !neighborhood) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If a homeowner is signed in, attach their user_id so the lead shows up
    // in their dashboard. Anonymous flows still work — homeowner_user_id stays null.
    const session = await auth.api.getSession({ headers: request.headers });
    const homeownerUserId = session?.user?.id ?? null;

    const lead_id = crypto.randomUUID();

    await sql`
      INSERT INTO leads (
        lead_id, category, problem, scope, fair_price_range, severity,
        neighborhood, photo_keys, status, chosen_provider_id, homeowner_user_id
      ) VALUES (
        ${lead_id}, ${category}, ${problem}, ${scope}, ${fair_price_range}, ${severity},
        ${neighborhood}, ${photo_keys},
        ${chosen_provider_id ? 'connected' : 'open'},
        ${chosen_provider_id || null},
        ${homeownerUserId}
      )
    `;

    return Response.json({ lead_id, status: 'created' });
  } catch (error) {
    console.error('Error creating lead:', error);
    return Response.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const provider_id = searchParams.get('provider_id');
    const status = searchParams.get('status');
    const forProvider = searchParams.get('for_provider'); // = 'me' or a provider_id

    // Provider inbox: leads matched to the signed-in user's claimed provider
    // (trade matches AND neighborhood ∈ areas_served).
    if (forProvider) {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user?.id) {
        return Response.json({ error: 'Not signed in' }, { status: 401 });
      }
      const claimed = await sql<{ provider_id: string; category: string; areas_served: string[] }>`
        SELECT p.provider_id, p.category, p.areas_served
        FROM provider_users pu
        JOIN providers p ON p.provider_id = pu.provider_id
        WHERE pu.user_id = ${session.user.id}
        LIMIT 1
      `;
      if (claimed.length === 0) {
        return Response.json({ leads: [], reason: 'no-provider-claimed' });
      }
      const me = claimed[0];
      const leads = await sql`
        SELECT
          l.lead_id, l.category, l.problem, l.scope, l.fair_price_range,
          l.severity, l.neighborhood, l.status, l.created_at,
          q.id IS NOT NULL AS quoted,
          q.amount_low AS quote_low,
          q.amount_high AS quote_high,
          q.created_at AS quoted_at
        FROM leads l
        LEFT JOIN lead_quotes q
          ON q.lead_id = l.lead_id AND q.provider_id = ${me.provider_id}
        WHERE l.status = 'open'
          AND l.category = ${me.category}
          AND l.neighborhood = ANY(${me.areas_served})
        ORDER BY
          CASE l.severity WHEN 'urgent' THEN 0 WHEN 'soon' THEN 1 ELSE 2 END,
          l.created_at DESC
        LIMIT 50
      `;
      return Response.json({ leads, provider: me });
    }

    // Return all open leads (public demo dashboard — leaving for now)
    if (status === 'open') {
      const leads = await sql`
        SELECT lead_id, category, problem, scope, fair_price_range,
               severity, neighborhood, status, created_at
        FROM leads
        WHERE status = 'open'
        ORDER BY
          CASE severity WHEN 'urgent' THEN 0 WHEN 'soon' THEN 1 ELSE 2 END,
          created_at DESC
        LIMIT 20
      `;
      return Response.json({ leads });
    }

    if (!provider_id) {
      return Response.json({ error: 'provider_id, status=open, or for_provider is required' }, { status: 400 });
    }

    // Return leads where this specific provider was chosen
    const leads = await sql`
      SELECT lead_id, category, problem, scope, fair_price_range,
             severity, neighborhood, status, created_at
      FROM leads
      WHERE chosen_provider_id = ${provider_id}
      ORDER BY created_at DESC
    `;

    return Response.json({ leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return Response.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}
