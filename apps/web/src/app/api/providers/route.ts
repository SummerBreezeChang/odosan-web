import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const neighborhood = searchParams.get('neighborhood');

    if (!category || !neighborhood) {
      return Response.json({ error: 'Category and neighborhood are required' }, { status: 400 });
    }

    // Query providers that match the category and serve the neighborhood
    const providers = await sql`
      SELECT 
        provider_id,
        name,
        category,
        phone,
        website,
        google_maps_url,
        rating,
        verification_status
      FROM providers
      WHERE 
        category = ${category}
        AND ${neighborhood} = ANY(areas_served)
        AND verification_status != 'rejected'
      ORDER BY 
        CASE WHEN verification_status = 'verified' THEN 0 ELSE 1 END,
        rating DESC NULLS LAST,
        name ASC
      LIMIT 3
    `;

    return Response.json({ providers });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return Response.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}
