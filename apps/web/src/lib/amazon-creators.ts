/**
 * Amazon Creators API client (v3.x — Login with Amazon / LwA).
 *
 * Replaces the legacy PA-API + SigV4 path. Creators API is the only way to
 * get product data from Amazon for new applications since 2026; classic
 * PA-API is being deprecated 2026-05-15.
 *
 * Required env vars:
 *   AMAZON_CREDENTIAL_ID         — amzn1.application-oa2-client.<hash>
 *   AMAZON_CREDENTIAL_SECRET     — 40+ char secret from the Creators API "Add new credential" dialog
 *   AMAZON_ASSOCIATE_TAG         — partner tag, e.g. summerchang0a-20
 *
 * Optional env vars (defaults are NA / US marketplace):
 *   AMAZON_OAUTH_TOKEN_URL       — default: https://api.amazon.com/auth/o2/token
 *                                   EU (v3.2):  https://api.amazon.co.uk/auth/o2/token
 *                                   FE (v3.3):  https://api.amazon.co.jp/auth/o2/token
 *   AMAZON_OAUTH_SCOPE           — default: creatorsapi::default
 *   AMAZON_API_BASE_URL          — default: https://creatorsapi.amazon
 *   AMAZON_MARKETPLACE           — default: www.amazon.com
 */

const DEFAULT_TOKEN_URL = 'https://api.amazon.com/auth/o2/token';
const DEFAULT_API_BASE_URL = 'https://creatorsapi.amazon';
const DEFAULT_MARKETPLACE = 'www.amazon.com';
const DEFAULT_SCOPE = 'creatorsapi::default';
const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

export type AmazonProduct = {
  asin: string;
  title: string;
  url: string; // already affiliate-tagged by Creators API
  image: string | null;
  price: string | null; // formatted, e.g. "$24.99"
  priceAmount: number | null;
  rating: number | null;
  reviewCount: number | null;
};

// Module-scope token cache. Lives across requests within a warm Vercel
// function instance (cold starts re-fetch — that's fine, ~once per instance).
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const credentialId = process.env.AMAZON_CREDENTIAL_ID;
  const credentialSecret = process.env.AMAZON_CREDENTIAL_SECRET;
  if (!credentialId || !credentialSecret) {
    throw new Error(
      'Missing Creators API credentials. Set AMAZON_CREDENTIAL_ID and AMAZON_CREDENTIAL_SECRET on Vercel.'
    );
  }

  const tokenUrl = process.env.AMAZON_OAUTH_TOKEN_URL || DEFAULT_TOKEN_URL;
  const scope = process.env.AMAZON_OAUTH_SCOPE || DEFAULT_SCOPE;

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: credentialId,
      client_secret: credentialSecret,
      scope,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Token fetch failed (${res.status}): ${text.slice(0, 200)}`);
  }

  let data: { access_token?: string; expires_in?: number };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Token response was not JSON: ${text.slice(0, 200)}`);
  }
  if (!data.access_token) {
    throw new Error('Token response missing access_token field');
  }

  const expiresInMs = (data.expires_in ?? 3600) * 1000;
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + expiresInMs - TOKEN_EXPIRY_BUFFER_MS,
  };
  return cachedToken.token;
}

type CreatorsApiItem = {
  asin?: string;
  detailPageURL?: string;
  images?: {
    primary?: {
      small?: { url?: string };
      medium?: { url?: string };
      large?: { url?: string };
    };
  };
  itemInfo?: {
    title?: { displayValue?: string };
  };
  offersV2?: {
    listings?: Array<{
      price?: {
        money?: { amount?: number; displayAmount?: string };
      };
    }>;
  };
  customerReviews?: {
    starRating?: { value?: number };
    count?: number;
  };
};

/**
 * Search Amazon by keywords. Returns up to ~10 affiliate-tagged products.
 *
 * @param keywords  e.g. "P-trap kit 1.5 inch"
 * @param itemCount cap on results (Amazon may return fewer). Ignored if API
 *                   doesn't accept itemCount in the body — it always returns ≤10.
 * @param searchIndex Amazon product category, default "All".
 */
export async function searchItems(
  keywords: string,
  itemCount = 5,
  searchIndex = 'All'
): Promise<AmazonProduct[]> {
  const partnerTag = process.env.AMAZON_ASSOCIATE_TAG;
  if (!partnerTag) {
    throw new Error('Missing AMAZON_ASSOCIATE_TAG');
  }
  const apiBase = process.env.AMAZON_API_BASE_URL || DEFAULT_API_BASE_URL;
  const marketplace = process.env.AMAZON_MARKETPLACE || DEFAULT_MARKETPLACE;

  const token = await getAccessToken();

  const payload = {
    keywords,
    marketplace,
    partnerTag,
    searchIndex,
    resources: [
      'itemInfo.title',
      'images.primary.medium',
      'offersV2.listings.price',
    ],
  };

  const res = await fetch(`${apiBase}/catalog/v1/searchItems`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-marketplace': marketplace,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Creators API returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const err = data as {
      errors?: Array<{ code?: string; message?: string }>;
      message?: string;
    };
    const msg =
      err?.errors?.[0]?.message ||
      err?.message ||
      `Creators API ${res.status}`;
    throw new Error(msg);
  }

  // SearchItems wraps in searchResult; GetItems wraps in itemsResult. Handle both
  // in case Amazon's response shape is shared between operations.
  const responseEnvelope = data as {
    searchResult?: { items?: CreatorsApiItem[] };
    itemsResult?: { items?: CreatorsApiItem[] };
  };
  const items =
    responseEnvelope?.searchResult?.items ??
    responseEnvelope?.itemsResult?.items ??
    [];

  const normalized = items
    .map(normalizeItem)
    .filter((p): p is AmazonProduct => p !== null)
    .slice(0, Math.min(Math.max(itemCount, 1), 10));
  return normalized;
}

function normalizeItem(item: CreatorsApiItem): AmazonProduct | null {
  const asin = item.asin;
  const title = item.itemInfo?.title?.displayValue;
  const url = item.detailPageURL;
  if (!asin || !title || !url) return null;

  const image =
    item.images?.primary?.medium?.url ??
    item.images?.primary?.large?.url ??
    item.images?.primary?.small?.url ??
    null;

  const firstListing = item.offersV2?.listings?.[0];
  const money = firstListing?.price?.money;
  const price = money?.displayAmount ?? null;
  const priceAmount = typeof money?.amount === 'number' ? money.amount : null;

  return {
    asin,
    title,
    url, // already affiliate-tagged with partner tag
    image,
    price,
    priceAmount,
    rating: item.customerReviews?.starRating?.value ?? null,
    reviewCount: item.customerReviews?.count ?? null,
  };
}

export function isCreatorsApiConfigured(): boolean {
  return Boolean(
    process.env.AMAZON_CREDENTIAL_ID &&
      process.env.AMAZON_CREDENTIAL_SECRET &&
      process.env.AMAZON_ASSOCIATE_TAG
  );
}
