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

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';

    const rows = await sql<ProviderRow>`
      SELECT p.provider_id, p.name, p.category, p.phone, p.areas_served, p.rating::float
      FROM providers p
      LEFT JOIN provider_users pu ON pu.provider_id = p.provider_id
      WHERE pu.user_id IS NULL
        AND (${q} = '' OR lower(p.name) LIKE '%' || lower(${q}) || '%')
      ORDER BY p.rating DESC NULLS LAST, p.name ASC
      LIMIT 25
    `;

    return Response.json({ providers: rows });
  } catch (error) {
    console.error('[/api/providers/unclaimed error]', error);
    return Response.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
