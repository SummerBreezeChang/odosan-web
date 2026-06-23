import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * FeatureTile — pastel rounded card used for binary forks (e.g. DIY vs
 * Pro on the diagnosis result). Two should appear side-by-side with equal
 * visual weight; the recommended one gets a slightly stronger tint via
 * the `recommended` prop.
 */
export function FeatureTile({
  href,
  onClick,
  eyebrow,
  title,
  body,
  cta,
  tone,
  recommended = false,
  className = '',
}: {
  href?: string;
  onClick?: () => void;
  eyebrow: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  cta?: ReactNode;
  tone: 'good' | 'soon' | 'leaf' | 'neutral';
  recommended?: boolean;
  className?: string;
}) {
  const toneBg =
    tone === 'good'
      ? recommended
        ? 'bg-od-green-soft'
        : 'bg-od-green-soft/60'
      : tone === 'soon'
      ? recommended
        ? 'bg-od-orange-soft'
        : 'bg-od-orange-soft/60'
      : tone === 'leaf'
      ? recommended
        ? 'bg-od-primary-soft'
        : 'bg-od-primary-soft/60'
      : 'bg-white/60';

  const toneEyebrow =
    tone === 'good'
      ? 'text-od-green'
      : tone === 'soon'
      ? 'text-od-orange'
      : tone === 'leaf'
      ? 'text-od-leaf'
      : 'text-od-muted';

  const inner = (
    <div
      className={`flex h-full flex-col rounded-[18px] border border-od-border ${toneBg} p-4 text-left transition-shadow hover:shadow-[0_8px_20px_rgba(27,56,42,0.08)]`}
    >
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${toneEyebrow}`}
      >
        {recommended ? `Recommended · ${eyebrow}` : eyebrow}
      </p>
      <h3
        className="mt-2 text-[17px] font-semibold leading-[1.25] text-od-ink"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      {body && (
        <p className="mt-1.5 text-[13px] leading-[1.5] text-od-muted">{body}</p>
      )}
      {cta && (
        <p className="mt-auto pt-3 text-[13px] font-semibold text-od-ink">
          {cta} →
        </p>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className={`block ${className}`}>
        {inner}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`block w-full ${className}`}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}
