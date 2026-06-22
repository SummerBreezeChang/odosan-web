import { NextRequest } from 'next/server';
import { searchItems, type AmazonProduct } from '@/lib/amazon-paapi';
import { buildQueries, type Extracted } from '@/lib/amazon-queries';

type Bucket = {
  query: string;
  products: AmazonProduct[];
  error: string | null;
};

type RequestBody = {
  // Nameplate path — extracted system fields drive two buckets (extend + replace).
  extracted?: Extracted;
  // Diagnose path — raw Amazon keywords drive a single bucket.
  keywords?: string;
  searchIndex?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;

    if (body.keywords && body.keywords.trim()) {
      const single = await runBucket({
        keywords: body.keywords.trim(),
        searchIndex: body.searchIndex || 'All',
      });
      return Response.json({ single });
    }

    if (body.extracted?.system_type) {
      const queries = buildQueries(body.extracted);
      const [extend, replace] = await Promise.all([
        runBucket(queries.extend),
        runBucket(queries.replace),
      ]);
      return Response.json({ extend, replace });
    }

    return Response.json(
      { error: 'Provide either `keywords` or `extracted.system_type`.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[/api/amazon-search error]', error);
    return Response.json({ error: 'Failed to fetch shopping options' }, { status: 500 });
  }
}

async function runBucket(
  q: { keywords: string; searchIndex: string } | null
): Promise<Bucket | null> {
  if (!q) return null;
  try {
    const products = await searchItems(q.keywords, 5, q.searchIndex);
    return { query: q.keywords, products, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[amazon-search bucket failed]', q.keywords, msg);
    return { query: q.keywords, products: [], error: msg };
  }
}
