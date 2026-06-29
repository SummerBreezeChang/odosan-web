import type { ReactNode } from 'react';
import { ButtonLink } from './Button';

/**
 * EmptyState — centered placeholder shown when a list or section has no
 * data. Accepts an optional icon, heading, body copy, and a CTA link.
 */
export function EmptyState({
  icon,
  heading,
  body,
  cta,
  className = '',
}: {
  icon?: ReactNode;
  heading: string;
  body?: string;
  cta?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={`mt-3 flex flex-col items-center justify-center rounded-[18px] border border-od-border bg-white/60 px-6 py-10 text-center shadow-[0_1px_2px_rgba(27,56,42,0.05)] ${className}`}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-od-primary-soft text-od-primary">
          {icon}
        </div>
      )}
      <p className="text-[15px] font-semibold text-od-navy">{heading}</p>
      {body && (
        <p className="mt-1.5 max-w-xs text-[13px] leading-[1.5] text-od-muted">{body}</p>
      )}
      {cta && (
        <div className="mt-5">
          <ButtonLink href={cta.href} size="md">
            {cta.label}
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
