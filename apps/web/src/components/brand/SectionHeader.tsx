import type { ReactNode } from 'react';

/**
 * SectionHeader — Pi-pattern. A Fraunces title above a muted Inter subline.
 * Use at the top of every screen and section so type rhythm is consistent.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  size = 'h2',
  className = '',
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  size?: 'display' | 'h1' | 'h2' | 'h3';
  className?: string;
}) {
  const titleSize =
    size === 'display'
      ? 'text-[30px] leading-[1.15]'
      : size === 'h1'
      ? 'text-[24px] leading-[1.15]'
      : size === 'h2'
      ? 'text-[20px] leading-[1.2]'
      : 'text-[17px] leading-[1.25]';
  return (
    <header className={className}>
      {eyebrow && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-od-leaf">
          {eyebrow}
        </p>
      )}
      <h2
        className={`${titleSize} font-semibold text-od-ink`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-[15px] leading-[1.5] text-od-muted">{subtitle}</p>
      )}
    </header>
  );
}
