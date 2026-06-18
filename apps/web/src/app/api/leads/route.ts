import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';

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

    const lead_id = crypto.randomUUID();

    await sql`
      INSERT INTO leads (
        lead_id,
        category,
        problem,
        scope,
        fair_price_range,
        severity,
        neighborhood,
        photo_keys,
        status,
        chosen_provider_id
      ) VALUES (
        ${lead_id},
        ${category},
        ${problem},
        ${scope},
        ${fair_price_range},
        ${severity},
        ${neighborhood},
        ${photo_keys},
        ${chosen_provider_id ? 'connected' : 'open'},
        ${chosen_provider_id || null}
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

    // Return all open leads (for provider inbox demo — no auth yet)
    if (status === 'open') {
      const leads = await sql`
        SELECT 
          lead_id,
          category,
          problem,
          scope,
          fair_price_range,
          severity,
          neighborhood,
          status,
          created_at
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
      return Response.json({ error: 'provider_id or status=open is required' }, { status: 400 });
    }

    // Return leads where this specific provider was chosen
    const leads = await sql`
      SELECT 
        lead_id,
        category,
        problem,
        scope,
        fair_price_range,
        severity,
        neighborhood,
        status,
        created_at
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
