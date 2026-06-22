import { NextRequest } from 'next/server';
import sql from '@/app/api/utils/sql';
import { auth } from '@/lib/auth';

/**
 * POST /api/home-record/brief — append a diagnosis brief to the signed-in
 * user's home record.
 *
 * Body: { category, neighborhood, issue, severity, scopeOfWork, fairPriceRange,
 *         diyOrPro, explanation, confidence, diyShoppingQuery }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return Response.json({ error: 'Not signed in' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await request.json();
    const {
      category,
      neighborhood,
      issue,
      severity,
      scopeOfWork,
      fairPriceRange,
      diyOrPro,
      explanation,
      confidence,
      diyShoppingQuery,
    } = body ?? {};

    if (!category || !issue || !severity || !scopeOfWork || !fairPriceRange || !diyOrPro || !explanation) {
      return Response.json({ error: 'Missing required brief fields' }, { status: 400 });
    }

    const rows = await sql<{ id: string; saved_at: string }>`
      INSERT INTO user_home_briefs (
        user_id, category, neighborhood, issue, severity, scope_of_work,
        fair_price_range, diy_or_pro, explanation, confidence, diy_shopping_query
      ) VALUES (
        ${userId}, ${category}, ${neighborhood ?? ''}, ${issue}, ${severity},
        ${scopeOfWork}, ${fairPriceRange}, ${diyOrPro}, ${explanation},
        ${typeof confidence === 'number' ? confidence : 0},
        ${diyShoppingQuery ?? ''}
      )
      RETURNING id, saved_at
    `;

    return Response.json({ id: rows[0]?.id, saved_at: rows[0]?.saved_at });
  } catch (error) {
    console.error('[/api/home-record/brief POST error]', error);
    return Response.json({ error: 'Failed to save brief' }, { status: 500 });
  }
}
