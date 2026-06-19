import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/diagnose', label: 'Diagnose' },
  { href: '/my-home', label: 'My Home' },
  { href: '/for-providers', label: 'For Providers' },
  { href: '/territory', label: 'Territory' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/support', label: 'Support' },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-od-navy/10 bg-od-navy">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-8 md:flex-row md:justify-between">
        <span
          className="text-lg font-bold text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          🏠 Odosan
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70">
          {FOOTER_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="transition-colors hover:text-white">
              {label}
            </Link>
          ))}
          <a href="mailto:contact@odosan.care" className="transition-colors hover:text-white">
            contact@odosan.care
          </a>
        </div>
        <p className="text-sm text-white/50">&copy; 2026 Odosan</p>
      </div>
    </footer>
  );
}
