import type { HTMLAttributes } from 'react';

/**
 * Label — 11px uppercase, 1.4px letter-spacing, muted color. Used as a
 * micro-eyebrow above section titles and as form-field labels.
 */
export function Label({
  className = '',
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.14em] text-od-muted ${className}`}
      {...props}
    />
  );
}
