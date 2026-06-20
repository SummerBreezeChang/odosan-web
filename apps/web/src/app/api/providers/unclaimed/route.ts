import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';

type ProviderRow = {
  provider_id: string;
  name: string;
  category: string;
  phone: string;
  areas_served: string[];
  rating: number | null;
};

// Human labels so a search for "plumbing" matches category "plumbing_drainage"
// (whose pretty name is "Plumbing & Drainage"). Without this, East Bay Drain
// Masters is invisible to anyone searching by trade rather than business name.
const CATEGORY_KEYWORDS: Record<string, string> = {
  plumbing_drainage: 'plumbing drainage drain',
  gutters_drainage: 'gutters drainage',
  landscaping: 'landscaping yard garden',
  roofing: 'roof roofing',
  electrical: 'electrical electric panel wiring',
  hvac: 'hvac heating air conditioning ac',
  pest_control: 'pest control exterminator',
  handyman: 'handyman repair',
  painting: 'painting paint',
};

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? '';
    const category = request.nextUrl.searchParams.get('category')?.trim() ?? '';

    // Server-side category keyword expansion: a search for "plumbing" should
    // match providers whose category keywords include "plumbing".
    const matchedCategories = q
      ? Object.entries(CATEGORY_KEYWORDS)
          .filter(([, kws]) => kws.includes(q))
          .map(([cat]) => cat)
      : [];

    const rows = await sql<ProviderRow>`
      SELECT p.provider_id, p.name, p.category, p.phone, p.areas_served, p.rating::float
      FROM providers p
      LEFT JOIN provider_users pu ON pu.provider_id = p.provider_id
      WHERE pu.user_id IS NULL
        AND (${category} = '' OR p.category = ${category})
        AND (
          ${q} = ''
          OR lower(p.name) LIKE '%' || ${q} || '%'
          OR p.category = ANY(${matchedCategories})
        )
      ORDER BY p.rating DESC NULLS LAST, p.name ASC
      LIMIT 50
    `;

    return Response.json({ providers: rows });
  } catch (error) {
    console.error('[/api/providers/unclaimed error]', error);
    return Response.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
