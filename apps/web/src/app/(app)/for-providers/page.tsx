import Link from 'next/link';

export default function ForProviders() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="scroll-mt-24 pt-2 sm:pt-4">
        <div className="rounded-3xl border border-od-primary/10 bg-white p-6 shadow-sm sm:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-od-primary/20 bg-od-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-od-primary">
                For East Bay service pros
              </div>
              <h1
                className="mt-5 w-full max-w-[672px] text-4xl font-bold leading-[1.08] text-od-navy sm:text-5xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Pre-diagnosed leads. Pay only when a homeowner picks you.
              </h1>
              <p className="mt-5 max-w-2xl pr-2 text-lg leading-relaxed text-od-muted">
                Odosan does the AI diagnosis up front, then matches the homeowner with 2–3 vetted
                pros. You see the problem and the neighborhood — never personal contact info — and
                only pay when the homeowner chooses to connect with you.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/account/signup"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-od-navy px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-od-navy/90 sm:w-auto"
                >
                  Join the provider pool →
                </Link>
                <Link
                  href="/provider"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-od-navy/15 bg-white px-6 py-3 text-base font-semibold text-od-navy transition-colors hover:bg-od-primary-soft sm:w-auto"
                >
                  Open my lead inbox
                </Link>
              </div>
              <p className="mt-2 text-xs leading-snug text-gray-500">
                Currently inviting plumbing, HVAC, roofing, electrical, and handyman pros across
                Berkeley, Oakland, Albany, El Cerrito, Kensington, Piedmont, Emeryville, and
                Alameda.
              </p>
            </div>
            <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-od-primary/10 bg-od-cream shadow-md">
                <div className="px-8 text-center">
                  <p className="mb-3 text-6xl">🧰</p>
                  <p className="text-sm font-medium text-od-muted/50">
                    Lead inbox preview placeholder
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works for providers */}
      <section className="mt-7 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
          How Odosan works for providers
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            [
              '01',
              'List your business — free',
              'No subscription, no setup fee. Tell us what you do and where you serve.',
            ],
            [
              '02',
              'Get pre-diagnosed leads',
              'Each lead arrives with the issue, scope of work, fair-price range, and neighborhood already worked out.',
            ],
            [
              '03',
              'Quote or skip',
              "If it's not a fit, ignore it — no penalty. If it is, the homeowner sees your business in the match list.",
            ],
            [
              '04',
              'Pay only on connect',
              'When the homeowner consents to share contact info with you, you pay a flat connect fee. No lead farm. No no-show losses.',
            ],
          ].map(([n, t, d]) => (
            <div key={n} className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">{n}</p>
              <h3 className="mt-2 text-lg font-bold text-od-navy">{t}</h3>
              <p className="mt-2 text-sm text-od-muted">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why providers like Odosan */}
      <section className="mt-7 mb-10 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
          Why providers like Odosan
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-green text-lg text-white">
              ✅
            </div>
            <h3 className="mt-3 text-lg font-bold text-od-navy">Aligned incentives</h3>
            <p className="mt-2 text-sm text-od-muted">
              You pay only when a homeowner picks you. No bidding, no spam credits, no monthly
              minimum.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-primary text-lg text-white">
              🧠
            </div>
            <h3 className="mt-3 text-lg font-bold text-od-navy">Better-qualified leads</h3>
            <p className="mt-2 text-sm text-od-muted">
              Every lead has been through an AI diagnosis with severity, scope, and fair-price
              context. You skip the "what is this thing even" calls.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-orange text-lg text-white">
              🛡️
            </div>
            <h3 className="mt-3 text-lg font-bold text-od-navy">Privacy = trust</h3>
            <p className="mt-2 text-sm text-od-muted">
              Homeowners are more willing to share what&apos;s actually broken when they know
              their name and address won&apos;t leak. You see better honesty in the intake.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
