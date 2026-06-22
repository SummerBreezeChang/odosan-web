import { NextRequest } from 'next/server';
import { searchItems, type AmazonProduct } from '@/lib/amazon-paapi';
import { buildQueries, type Extracted } from '@/lib/amazon-queries';

type Bucket = {
  query: string;
  products: AmazonProduct[];
  error: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { extracted?: Extracted };
    const extracted = body.extracted;
    if (!extracted?.system_type) {
      return Response.json({ error: 'extracted.system_type is required' }, { status: 400 });
    }

    const queries = buildQueries(extracted);

    const [extend, replace] = await Promise.all([
      runBucket(queries.extend),
      runBucket(queries.replace),
    ]);

    return Response.json({ extend, replace });
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
