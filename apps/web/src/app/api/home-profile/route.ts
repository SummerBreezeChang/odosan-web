import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';

type SystemStatus = 'ok' | 'watch' | 'due' | 'unknown';

type HomeProfile = {
  parcel_id: string;
  address: string;
  zip: string;
  year_built: number | null;
  owner_type: string | null;
  systems: Record<
    string,
    { age: number | null; status: SystemStatus; confidence: number; basis: string }
  >;
  solar: {
    source: string;
    roof_area_m2: number;
    max_kwp: number;
    max_panel_count: number;
    annual_kwh: number;
    max_sunshine_hours_per_year: number;
    candidate: { rating: string; max_panels: number };
  };
  need_scores: Record<string, number>;
  top_needs: Array<{ trade: string; score: number }>;
};

export async function GET(request: NextRequest) {
  try {
    const address = request.nextUrl.searchParams.get('address')?.trim();
    if (!address) {
      return Response.json({ error: 'address is required' }, { status: 400 });
    }

    // Simple case-insensitive substring match. Works well on the 12-home sample;
    // swap for pg_trgm similarity when the dataset grows.
    const rows = await sql<HomeProfile>`
      SELECT parcel_id, address, zip, year_built, owner_type,
             systems, solar, need_scores, top_needs
      FROM home_profiles
      WHERE lower(address) LIKE '%' || lower(${address}) || '%'
      ORDER BY length(address) ASC
      LIMIT 1
    `;

    if (rows.length === 0) {
      return Response.json(
        { error: 'No home profile found for that address. Try the street name only.' },
        { status: 404 }
      );
    }

    return Response.json({ profile: rows[0] });
  } catch (error) {
    console.error('[/api/home-profile error]', error);
    return Response.json({ error: 'Failed to fetch home profile' }, { status: 500 });
  }
}
