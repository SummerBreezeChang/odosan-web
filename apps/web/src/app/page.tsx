import Link from 'next/link';

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="scroll-mt-24 pt-2 sm:pt-4">
        <div className="rounded-3xl border border-od-primary/10 bg-white p-6 shadow-sm sm:p-10">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
            <div className="min-w-0">
              <div className="inline-flex items-center rounded-full border border-od-primary/20 bg-od-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-od-primary">
                Home maintenance, AI-diagnosed
              </div>
              <h1
                className="mt-5 w-full max-w-[672px] text-4xl font-bold leading-[1.08] text-od-navy sm:text-5xl"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Your home&apos;s dad.
              </h1>
              <p className="mt-5 max-w-2xl pr-2 text-lg leading-relaxed text-od-muted">
                Snap a photo of what&apos;s wrong. Odosan diagnoses the issue, tells you what it
                should cost, and matches you with two or three vetted East Bay pros — without ever
                sharing your name or address until you say so.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/diagnose"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-od-navy px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-od-navy/90 sm:w-auto"
                >
                  Diagnose my problem →
                </Link>
                <Link
                  href="/my-home"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-od-navy/15 bg-white px-6 py-3 text-base font-semibold text-od-navy transition-colors hover:bg-od-primary-soft sm:w-auto"
                >
                  Look up my home
                </Link>
                <Link
                  href="/for-providers"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-od-navy/15 bg-white px-6 py-3 text-base font-semibold text-od-navy transition-colors hover:bg-od-primary-soft sm:w-auto"
                >
                  I&apos;m a service pro
                </Link>
              </div>
              <p className="mt-2 text-xs leading-snug text-gray-500">
                Free for homeowners. Providers pay only when a homeowner chooses them.
              </p>
            </div>
            <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
              <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-od-primary/10 bg-od-cream shadow-md">
                <div className="px-8 text-center">
                  <p className="mb-3 text-6xl">🏠</p>
                  <p className="text-sm font-medium text-od-muted/50">App screenshot placeholder</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="mt-7 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
          How it works
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            [
              '01',
              'Snap a photo',
              "Tell us what's wrong in a sentence. Add a photo if you have one. Pick your neighborhood.",
            ],
            [
              '02',
              'Get an AI diagnosis',
              'Gemini reads your photo + description and explains the issue, urgency, and a fair price range for the East Bay.',
            ],
            [
              '03',
              'Compare 2–3 vetted pros',
              "See what's included and what each one costs — not generic listings, real East Bay providers.",
            ],
            [
              '04',
              'Connect when you&apos;re ready',
              'Your name and address stay private until you consent. The pro pays Odosan only when you choose them.',
            ],
          ].map(([n, t, d]) => (
            <div key={n} className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">{n}</p>
              <h3 className="mt-2 text-lg font-bold text-od-navy">{t}</h3>
              <p
                className="mt-2 text-sm text-od-muted"
                dangerouslySetInnerHTML={{ __html: d as string }}
              />
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="/diagnose"
            className="inline-flex items-center justify-center rounded-xl bg-od-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-od-navy/90"
          >
            Try it now →
          </Link>
        </div>
      </section>

      {/* Why Odosan */}
      <section
        id="why"
        className="mt-7 mb-10 rounded-3xl border border-od-border bg-white p-6 shadow-sm sm:p-8"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
          Why Odosan
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-green text-lg text-white">
              🛡️
            </div>
            <h3 className="mt-3 text-lg font-bold text-od-navy">Privacy by default</h3>
            <p className="mt-2 text-sm text-od-muted">
              Providers see the problem and the neighborhood — never your name or address. Photo
              EXIF is stripped on upload. You stay anonymous until you choose to connect.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-primary text-lg text-white">
              📍
            </div>
            <h3 className="mt-3 text-lg font-bold text-od-navy">East Bay-specific</h3>
            <p className="mt-2 text-sm text-od-muted">
              Not generic checklists. Odosan&apos;s diagnoses account for Berkeley clay soil,
              pre-1940 housing stock, and the real range of what plumbers in Oakland actually
              charge.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-orange text-lg text-white">
              👨
            </div>
            <h3 className="mt-3 text-lg font-bold text-od-navy">Dad&apos;s voice</h3>
            <p className="mt-2 text-sm text-od-muted">
              Direct, warm, practical advice. &ldquo;Flush the sediment. Costs 20 minutes. Adds 3–5
              years.&rdquo; No fluff.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
