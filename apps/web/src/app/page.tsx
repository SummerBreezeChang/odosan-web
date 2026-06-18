import Link from 'next/link';

const NAV = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'Features' },
  { href: '#why', label: 'Why Odosan' },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-od-bg">
      <header className="sticky top-0 z-50 px-2 pt-2 pb-1 sm:px-3">
        <div className="mx-auto hidden max-w-6xl flex-col items-center md:flex">
          <div
            className="my-4 md:my-6 inline-flex max-w-full min-w-0 flex-nowrap items-center justify-center gap-1.5 overflow-x-auto rounded-full border border-white/80 bg-white/45 px-[22px] py-3 shadow-[0_8px_32px_rgba(15,23,42,0.1)] backdrop-blur-xl"
            role="navigation"
            aria-label="Site"
          >
            <Link
              href="/"
              className="ml-0 mr-4 shrink-0 pl-[10px] pr-4 text-lg font-bold tracking-tight text-od-navy sm:pl-[22px] sm:text-xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              🏠 Odosan
            </Link>
            <nav className="flex shrink-0 items-center justify-center gap-2" aria-label="Main">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-od-primary-soft hover:text-od-navy"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/diagnose"
                className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-od-primary-soft hover:text-od-navy"
              >
                Try the concierge
              </Link>
            </nav>
            <div className="ml-2 flex shrink-0 items-center pr-0.5 sm:pr-1">
              <Link
                href="/diagnose"
                className="inline-flex items-center justify-center rounded-full bg-od-navy px-5 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-od-navy/90 sm:py-2"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-2 md:hidden">
          <div className="flex min-h-[52px] min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/80 bg-white/55 px-3 py-2 shadow-[0_8px_28px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <Link
              href="/"
              className="shrink-0 text-lg font-bold tracking-tight text-od-navy"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              🏠 Odosan
            </Link>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <Link
                href="/diagnose"
                className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full bg-od-navy px-4 text-sm font-semibold text-white shadow-sm hover:bg-od-navy/90"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-0 w-full max-w-6xl px-6 py-0">
        <section className="scroll-mt-24">
          <div className="rounded-3xl border border-od-primary/10 bg-white p-8 shadow-sm sm:p-10">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-od-primary/20 bg-od-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-od-primary">
                  Home maintenance sidekick
                </div>
                <h1
                  className="mt-5 w-full max-w-[672px] text-4xl font-bold leading-[1.08] text-od-navy sm:text-5xl"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Your home&apos;s dad.
                </h1>
                <p className="mt-5 max-w-2xl pr-4 text-lg leading-relaxed text-od-muted">
                  Personalized maintenance guidance for first-time homeowners. Odosan knows your
                  home&apos;s age, soil type, and climate — and tells you what to fix before it
                  breaks.
                </p>
                <div className="mt-8 flex flex-wrap gap-3" id="download">
                  <Link
                    href="/diagnose"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-od-navy px-[44px] py-3 text-sm font-semibold text-white transition-colors hover:bg-od-navy/90"
                  >
                    Try the AI concierge
                  </Link>
                  <a
                    href="#"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-od-navy/15 bg-white px-[28px] py-3 text-sm font-semibold text-od-navy transition-colors hover:bg-od-primary-soft"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    Download on the App Store
                  </a>
                </div>
                <p className="mt-1.5 w-fit px-3 text-center text-xs leading-snug text-gray-500">
                  Free for homeowners. Premium features available.
                </p>
              </div>
              <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-od-primary/10 bg-od-cream shadow-md">
                  <div className="text-center px-8">
                    <p className="text-6xl mb-3">🏠</p>
                    <p className="text-sm font-medium text-od-muted/50">App screenshot placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mt-7 rounded-3xl border border-od-border bg-white p-7 shadow-sm sm:p-8"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
            How it works
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              [
                '01',
                'Set up your home',
                "Enter your address. Odosan auto-detects soil type, climate zone, and regional hazards.",
              ],
              [
                '02',
                'Track your systems',
                'Select your water heater, HVAC, sump pump, and more. Each gets a service interval and health score.',
              ],
              [
                '03',
                "Get dad's advice",
                'Seasonal alerts, building code warnings, and AI-powered guidance — specific to your home, not generic checklists.',
              ],
              [
                '04',
                'Log & improve',
                'Log services, watch your score tick up, and share your maintenance history with insurers for lower premiums.',
              ],
            ].map(([n, t, d]) => (
              <div key={n} className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-od-primary">{n}</p>
                <h3 className="mt-2 text-xl font-bold text-od-navy">{t}</h3>
                <p className="mt-2 text-sm text-od-muted">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="features"
          className="mt-7 rounded-3xl border border-od-border bg-white p-7 shadow-sm sm:p-8"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-od-primary">Features</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              [
                '📊',
                '#EFF6FF',
                'Home Health Scorecard',
                "A single score (0–100) that shows your home's condition. Broken into structural age, systems coverage, service history, profile completeness, and risk readiness.",
              ],
              [
                '🔔',
                '#FFFBEB',
                'Seasonal Alerts',
                "Oakland clay soil? Rain season starts Nov–Mar. Odosan sends push notifications when it's time to test your sump pump, clean gutters, or prep for fire season.",
              ],
              [
                '🤖',
                '#F0FDF4',
                'Ask Odosan',
                "AI-powered chat that knows your home's data. Ask 'What should I do before winter?' and get advice specific to your address, home age, and tracked systems.",
              ],
              [
                '📱',
                '#FEF2F2',
                'AR Scan (Beta)',
                'Point your phone at your water heater or HVAC unit. See its health status, last service date, and next steps overlaid on your screen.',
              ],
              [
                '💰',
                '#EDE9FE',
                'Budget Tracking',
                "Track maintenance spending over time. See where your money goes and how it protects your home's value.",
              ],
              [
                '⚠️',
                '#FFF7ED',
                'Building Code Flags',
                'Pre-1970 home? Odosan warns about galvanized pipes, lead paint, asbestos, and K&T wiring — automatically from your year built.',
              ],
            ].map(([emoji, bg, title, desc]) => (
              <div key={title} className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                  style={{ background: bg }}
                >
                  {emoji}
                </div>
                <h3 className="mt-3 text-xl font-bold text-od-navy">{title}</h3>
                <p className="mt-2 text-sm text-od-muted">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="why"
          className="mt-7 mb-10 rounded-3xl border border-od-border bg-white p-7 shadow-sm sm:p-8"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-od-primary">
            Why Odosan
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-green text-lg text-white">
                🛡️
              </div>
              <h3 className="mt-3 text-xl font-bold text-od-navy">Insurance-ready</h3>
              <p className="mt-2 text-sm text-od-muted">
                Share your timestamped maintenance history with insurers. Documented upkeep = lower
                premiums.
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-primary text-lg text-white">
                📍
              </div>
              <h3 className="mt-3 text-xl font-bold text-od-navy">Regional intelligence</h3>
              <p className="mt-2 text-sm text-od-muted">
                Not generic checklists. Odosan knows your soil type, rain season, fire risk, and
                building code history.
              </p>
            </div>
            <div className="min-w-0 rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-od-orange text-lg text-white">
                👨
              </div>
              <h3 className="mt-3 text-xl font-bold text-od-navy">Dad&apos;s voice</h3>
              <p className="mt-2 text-sm text-od-muted">
                Direct, warm, practical advice. &ldquo;Flush the sediment. Costs 20 minutes. Adds 3–5
                years.&rdquo; No fluff.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-od-navy/10 bg-od-navy">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 md:flex-row md:justify-between">
          <span
            className="text-lg font-bold text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            🏠 Odosan
          </span>
          <div className="flex items-center gap-6 text-sm text-white/70">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/diagnose" className="transition-colors hover:text-white">
              Diagnose
            </Link>
            <Link href="/provider" className="transition-colors hover:text-white">
              For Providers
            </Link>
            <a href="mailto:contact@odosan.care" className="transition-colors hover:text-white">
              contact@odosan.care
            </a>
          </div>
          <p className="text-sm text-white/50">&copy; 2026 Odosan</p>
        </div>
      </footer>
    </div>
  );
}
