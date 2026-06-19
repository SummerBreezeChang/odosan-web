import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';

type TerritoryRow = {
  zip: string;
  homes_count: number;
  demand: Record<string, number>;
};

export async function GET(request: NextRequest) {
  try {
    const zip = request.nextUrl.searchParams.get('zip')?.trim();

    // No zip = return the index of all available zips (for provider's picker).
    if (!zip) {
      const all = await sql<TerritoryRow>`
        SELECT zip, homes_count, demand
        FROM territory_summaries
        ORDER BY zip ASC
      `;
      return Response.json({ summaries: all });
    }

    if (!/^\d{5}$/.test(zip)) {
      return Response.json({ error: 'zip must be a 5-digit US ZIP' }, { status: 400 });
    }

    const rows = await sql<TerritoryRow>`
      SELECT zip, homes_count, demand
      FROM territory_summaries
      WHERE zip = ${zip}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: 'No territory data for that ZIP yet.' },
        { status: 404 }
      );
    }

    return Response.json({ summary: rows[0] });
  } catch (error) {
    console.error('[/api/territory error]', error);
    return Response.json({ error: 'Failed to fetch territory summary' }, { status: 500 });
  }
}
