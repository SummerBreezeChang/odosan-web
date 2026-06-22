import Link from 'next/link';

// Light, understated footer. The provider entry point is demoted to a single
// quiet "For service pros" link.
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-od-navy/10">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-8 text-center">
        <span
          className="text-base font-bold text-od-navy"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Odosan
        </span>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-od-muted">
          <Link href="/for-providers" className="transition-colors hover:text-od-navy">
            For service pros
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-od-navy">
            Privacy
          </Link>
          <Link href="/support" className="transition-colors hover:text-od-navy">
            Support
          </Link>
          <a href="mailto:contact@odosan.tech" className="transition-colors hover:text-od-navy">
            contact@odosan.tech
          </a>
        </div>
        <p className="text-xs text-od-subtle">&copy; 2026 Odosan</p>
      </div>
    </footer>
  );
}
