import crypto from 'node:crypto';

/**
 * Minimal Amazon Product Advertising API 5.0 client.
 * No external deps — signs with built-in node crypto.
 *
 * Required env: AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_ASSOCIATE_TAG.
 * Optional env: AMAZON_HOST (default webservices.amazon.com), AMAZON_REGION (default us-east-1),
 *               AMAZON_MARKETPLACE (default www.amazon.com).
 *
 * PA-API throttles to ~1 TPS for new accounts. Caller should handle 429.
 */

export type AmazonProduct = {
  asin: string;
  title: string;
  url: string; // already affiliate-tagged by PA-API
  image: string | null;
  price: string | null; // formatted, e.g. "$24.99"
  priceAmount: number | null;
  rating: number | null; // 0-5, may be absent
  reviewCount: number | null;
};

const SERVICE = 'ProductAdvertisingAPI';
const ENDPOINT_PATH = '/paapi5/searchitems';
const TARGET = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';

const RESOURCES = [
  'Images.Primary.Medium',
  'ItemInfo.Title',
  'Offers.Listings.Price',
  'CustomerReviews.StarRating',
  'CustomerReviews.Count',
];

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function hex(data: Buffer | string): string {
  return typeof data === 'string'
    ? crypto.createHash('sha256').update(data, 'utf8').digest('hex')
    : data.toString('hex');
}

function sha256Hex(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function signingKey(secret: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac('AWS4' + secret, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, 'aws4_request');
}

export async function searchItems(
  keywords: string,
  itemCount = 5,
  searchIndex = 'All'
): Promise<AmazonProduct[]> {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const partnerTag = process.env.AMAZON_ASSOCIATE_TAG;
  const host = process.env.AMAZON_HOST || 'webservices.amazon.com';
  const region = process.env.AMAZON_REGION || 'us-east-1';
  const marketplace = process.env.AMAZON_MARKETPLACE || 'www.amazon.com';

  if (!accessKey || !secretKey || !partnerTag) {
    throw new Error(
      'Missing Amazon credentials. Set AMAZON_ACCESS_KEY, AMAZON_SECRET_KEY, AMAZON_ASSOCIATE_TAG in .env.local'
    );
  }

  const payload = {
    Keywords: keywords,
    Resources: RESOURCES,
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: marketplace,
    SearchIndex: searchIndex,
    ItemCount: Math.min(Math.max(itemCount, 1), 10),
  };
  const payloadJson = JSON.stringify(payload);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;

  // Canonical headers must be sorted alphabetically by lowercase header name.
  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:application/json; charset=utf-8\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${TARGET}\n`;
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';

  const canonicalRequest =
    `POST\n${ENDPOINT_PATH}\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256Hex(payloadJson)}`;

  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;

  const signature = hex(hmac(signingKey(secretKey, dateStamp, region, SERVICE), stringToSign));
  const authHeader =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${ENDPOINT_PATH}`, {
    method: 'POST',
    headers: {
      'content-encoding': 'amz-1.0',
      'content-type': 'application/json; charset=utf-8',
      host,
      'x-amz-date': amzDate,
      'x-amz-target': TARGET,
      Authorization: authHeader,
    },
    body: payloadJson,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`PA-API returned non-JSON: ${text.slice(0, 200)}`);
  }

  if (!res.ok) {
    const errMsg =
      (data as { Errors?: Array<{ Code: string; Message: string }> })?.Errors?.[0]?.Message ||
      `PA-API ${res.status}`;
    throw new Error(errMsg);
  }

  const items = (data as { SearchResult?: { Items?: PaapiItem[] } })?.SearchResult?.Items ?? [];
  return items.map(normalizeItem).filter((p): p is AmazonProduct => p !== null);
}

type PaapiItem = {
  ASIN?: string;
  DetailPageURL?: string;
  Images?: { Primary?: { Medium?: { URL?: string } } };
  ItemInfo?: { Title?: { DisplayValue?: string } };
  Offers?: {
    Listings?: Array<{
      Price?: { Amount?: number; DisplayAmount?: string };
    }>;
  };
  CustomerReviews?: {
    StarRating?: { Value?: number };
    Count?: number;
  };
};

function normalizeItem(item: PaapiItem): AmazonProduct | null {
  const asin = item.ASIN;
  const title = item.ItemInfo?.Title?.DisplayValue;
  const url = item.DetailPageURL;
  if (!asin || !title || !url) return null;

  const offer = item.Offers?.Listings?.[0]?.Price;
  return {
    asin,
    title,
    url,
    image: item.Images?.Primary?.Medium?.URL ?? null,
    price: offer?.DisplayAmount ?? null,
    priceAmount: offer?.Amount ?? null,
    rating: item.CustomerReviews?.StarRating?.Value ?? null,
    reviewCount: item.CustomerReviews?.Count ?? null,
  };
}
