import { searchItems } from '@/lib/amazon-creators';

/**
 * GET /api/amazon-creators-health
 *
 * One-shot diagnostic for the Amazon Creators API integration. Returns a
 * JSON report covering: which env vars are set (without leaking secrets),
 * whether the OAuth token fetch + a test SearchItems call succeed, and a
 * human-readable error classification + hint when something fails.
 *
 * Curl it after deploying / changing env vars / waiting out the 48-hour
 * eligibility window. Anyone can hit it — values are previewed (first +
 * last 4 chars) but never returned in full.
 */
export async function GET() {
  const report: Record<string, unknown> = {};

  const credentialId = process.env.AMAZON_CREDENTIAL_ID;
  const credentialSecret = process.env.AMAZON_CREDENTIAL_SECRET;
  const associateTag = process.env.AMAZON_ASSOCIATE_TAG;

  // ─── 1. Env var check ──────────────────────────────────────────────────
  report.envVars = {
    AMAZON_CREDENTIAL_ID: credentialId
      ? { set: true, length: credentialId.length, preview: maskPreview(credentialId) }
      : { set: false },
    AMAZON_CREDENTIAL_SECRET: credentialSecret
      ? { set: true, length: credentialSecret.length, preview: maskShortPreview(credentialSecret) }
      : { set: false },
    AMAZON_ASSOCIATE_TAG: associateTag ? { set: true, value: associateTag } : { set: false },
    AMAZON_MARKETPLACE:
      process.env.AMAZON_MARKETPLACE ?? '(default: www.amazon.com)',
    AMAZON_OAUTH_TOKEN_URL:
      process.env.AMAZON_OAUTH_TOKEN_URL ?? '(default: https://api.amazon.com/auth/o2/token)',
    AMAZON_API_BASE_URL:
      process.env.AMAZON_API_BASE_URL ?? '(default: https://creatorsapi.amazon)',
    AMAZON_OAUTH_SCOPE:
      process.env.AMAZON_OAUTH_SCOPE ?? '(default: creatorsapi::default)',
  };

  if (!credentialId || !credentialSecret || !associateTag) {
    return Response.json(
      {
        ...report,
        status: 'fail',
        reason: 'One or more required env vars are missing on Production. See envVars above.',
        hint: 'Add the missing vars on Vercel with Production + Preview + Development checked, then redeploy.',
      },
      { status: 500 }
    );
  }

  // ─── 2. Try a real OAuth + SearchItems round-trip ─────────────────────
  const startedAt = Date.now();
  try {
    const products = await searchItems('plumbing repair kit', 3);
    const elapsedMs = Date.now() - startedAt;
    return Response.json({
      ...report,
      status: 'success',
      elapsedMs,
      searchTest: {
        keywords: 'plumbing repair kit',
        productCount: products.length,
        firstProduct: products[0]
          ? {
              asin: products[0].asin,
              title: products[0].title.slice(0, 80),
              hasImage: !!products[0].image,
              hasPrice: !!products[0].price,
              displayPrice: products[0].price,
              urlContainsTag:
                typeof products[0].url === 'string' &&
                products[0].url.includes(`tag=${associateTag}`),
            }
          : null,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const elapsedMs = Date.now() - startedAt;
    return Response.json(
      {
        ...report,
        status: 'fail',
        elapsedMs,
        errorMessage: msg,
        errorClass: classifyError(msg),
        hint: hintForError(msg),
      },
      { status: 502 }
    );
  }
}

// ─── helpers ────────────────────────────────────────────────────────────
function maskPreview(s: string): string {
  if (s.length <= 8) return '***';
  return `${s.slice(0, 30)}...${s.slice(-4)}`;
}

function maskShortPreview(s: string): string {
  if (s.length <= 8) return '***';
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

function classifyError(msg: string): string {
  if (msg.includes('Missing Creators API credentials')) return 'env_vars_missing';
  if (msg.includes('Token fetch failed (401)')) return 'token_auth_failed_wrong_credentials';
  if (msg.includes('Token fetch failed (400)')) return 'token_request_malformed_or_wrong_scope';
  if (msg.includes('Token fetch failed')) return 'token_fetch_other';
  if (msg.includes('Token response was not JSON')) return 'token_endpoint_returned_html';
  if (
    /AssociateNotEligible/i.test(msg) ||
    /does not (currently )?meet the eligibility requirements/i.test(msg)
  ) {
    return 'awaiting_eligibility_or_sales_threshold';
  }
  if (/TooManyRequests|429/i.test(msg)) return 'rate_limited';
  if (msg.includes('Creators API 401')) return 'api_unauthorized_token_invalid';
  if (msg.includes('Creators API 403')) return 'api_forbidden_check_partner_tag_or_region';
  if (msg.includes('Creators API 404')) return 'endpoint_not_found_check_base_url';
  if (msg.includes('non-JSON')) return 'api_returned_html_check_url';
  return 'unknown';
}

function hintForError(msg: string): string {
  if (
    /AssociateNotEligible/i.test(msg) ||
    /does not (currently )?meet the eligibility requirements/i.test(msg)
  ) {
    return 'Expected during 48-hour activation window. Also fires if account has <10 qualifying sales in past 30 days. The wiring is correct; this is an Amazon-side gate. Wait it out or hit the 10-sales bar.';
  }
  if (msg.includes('Token fetch failed (401)')) {
    return 'AMAZON_CREDENTIAL_ID or AMAZON_CREDENTIAL_SECRET is wrong. Open the Creators API console, click the copy button next to your Credential ID, paste into Vercel exactly. If you do not have the Secret, click "Add new credential" to generate a fresh pair.';
  }
  if (msg.includes('Token fetch failed (400)')) {
    return 'Scope or request shape mismatch. Confirm AMAZON_OAUTH_SCOPE is unset or "creatorsapi::default". For v2.x credentials (rare) the scope is "creatorsapi/default".';
  }
  if (msg.includes('Token response was not JSON')) {
    return 'Token endpoint returned HTML. Probably the wrong URL — confirm AMAZON_OAUTH_TOKEN_URL is unset (default api.amazon.com/auth/o2/token for NA v3.x) or matches your region.';
  }
  if (/TooManyRequests|429/i.test(msg)) {
    return 'Rate limit. Initial allowance is 1 TPS / 8640 TPD. Wait a few seconds and retry. Token caching should prevent this from recurring once warm.';
  }
  if (msg.includes('Creators API 401')) {
    return 'Bearer token was rejected. Possibly expired (refresh) or scope insufficient. Try again — the cached token will refresh.';
  }
  if (msg.includes('Creators API 403')) {
    return 'Forbidden. Verify your Partner Tag matches the marketplace (summerchang0a-20 + www.amazon.com) and that Creators API is approved in this region.';
  }
  if (msg.includes('Missing')) {
    return 'Add the missing env vars on Vercel Production and redeploy.';
  }
  return 'Unknown error. Send the full errorMessage above to the developer for diagnosis.';
}
