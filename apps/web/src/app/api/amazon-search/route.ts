import { NextRequest } from 'next/server';
import { searchItems, type AmazonProduct } from '@/lib/amazon-creators';
import { buildQueries, type Extracted } from '@/lib/amazon-queries';
import {
  buildCuratedProductUrl,
  matchCuratedProducts,
  type CuratedProduct,
} from '@/lib/amazon-curated';

type CuratedProductWithUrl = CuratedProduct & { url: string | null };

type Bucket = {
  query: string;
  products: AmazonProduct[];
  curatedProducts: CuratedProductWithUrl[]; // shown when products is empty (Creators API gated)
  searchUrl: string | null; // affiliate-tagged search fallback (always set when partner tag exists)
  error: string | null;
};

type RequestBody = {
  extracted?: Extracted;
  keywords?: string;
  searchIndex?: string;
};

/**
 * POST /api/amazon-search
 *
 * Tries the Amazon Creators API first (real product grid). If Amazon
 * returns the eligibility-gate error ('Your account does not currently
 * meet the eligibility requirements' / AssociateNotEligible), silently
 * falls back to an affiliate-tagged Amazon search URL — the UI renders a
 * 'Find on Amazon →' CTA instead of the empty grid. Same partner-tag
 * commission on click-throughs, no product grid.
 *
 * When the Amazon account ever generates 10+ qualifying sales in a 30-day
 * window, the next request auto-detects success and the product grid
 * renders without any code change.
 */
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

function buildAmazonSearchUrl(keywords: string): string | null {
  const tag = process.env.AMAZON_ASSOCIATE_TAG;
  const marketplace =
    process.env.AMAZON_MARKETPLACE || 'www.amazon.com';
  if (!tag) return null;
  const params = new URLSearchParams({ k: keywords, tag });
  return `https://${marketplace}/s?${params.toString()}`;
}

function isEligibilityError(msg: string): boolean {
  return (
    /AssociateNotEligible/i.test(msg) ||
    /does not (currently )?meet the eligibility requirements/i.test(msg)
  );
}

function buildCuratedBucket(query: string): CuratedProductWithUrl[] {
  const partnerTag = process.env.AMAZON_ASSOCIATE_TAG;
  const marketplace = process.env.AMAZON_MARKETPLACE || 'www.amazon.com';
  return matchCuratedProducts(query, 3).map((p) => ({
    ...p,
    url: buildCuratedProductUrl(p, partnerTag, marketplace),
  }));
}

async function runBucket(
  q: { keywords: string; searchIndex: string } | null
): Promise<Bucket | null> {
  if (!q) return null;
  const searchUrl = buildAmazonSearchUrl(q.keywords);
  try {
    const products = await searchItems(q.keywords, 5, q.searchIndex);
    // Real Amazon products always win; only populate curated when API empty.
    const curatedProducts = products.length === 0 ? buildCuratedBucket(q.keywords) : [];
    return { query: q.keywords, products, curatedProducts, searchUrl, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    // Silent fallback for the expected eligibility-gate case — UI shows
    // the curated product cards + deep-link CTA instead of an error banner.
    if (isEligibilityError(msg)) {
      return {
        query: q.keywords,
        products: [],
        curatedProducts: buildCuratedBucket(q.keywords),
        searchUrl,
        error: null,
      };
    }
    console.error('[amazon-search bucket failed]', q.keywords, msg);
    return { query: q.keywords, products: [], curatedProducts: [], searchUrl, error: msg };
  }
}
