import type { ReactNode } from 'react';

type BannerTone = 'leaf' | 'good' | 'soon' | 'urgent' | 'neutral';

const TONE: Record<
  BannerTone,
  { wrapper: string; icon: string; title: string; body: string }
> = {
  leaf: {
    wrapper: 'border-od-primary/20 bg-od-primary-soft',
    icon: 'text-od-leaf',
    title: 'text-od-navy',
    body: 'text-od-muted',
  },
  good: {
    wrapper: 'border-od-green/20 bg-od-green-soft',
    icon: 'text-od-green',
    title: 'text-od-green',
    body: 'text-od-green/80',
  },
  soon: {
    wrapper: 'border-od-orange/20 bg-od-orange-soft',
    icon: 'text-od-orange',
    title: 'text-od-orange',
    body: 'text-od-orange/80',
  },
  urgent: {
    wrapper: 'border-od-red/20 bg-od-red-soft',
    icon: 'text-od-red',
    title: 'text-od-red',
    body: 'text-od-red/80',
  },
  neutral: {
    wrapper: 'border-od-border bg-od-cream',
    icon: 'text-od-primary',
    title: 'text-od-navy',
    body: 'text-od-muted',
  },
};

/**
 * InfoBanner — a tinted strip with an optional leading icon, a title, and
 * body copy. Used for save nudges, migration notices, and promo callouts.
 * Pass `action` to render a button/link alongside the copy.
 */
export function InfoBanner({
  tone = 'leaf',
  icon,
  title,
  body,
  action,
  className = '',
}: {
  tone?: BannerTone;
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = TONE[tone];
  return (
    <div
      className={`rounded-[18px] border ${t.wrapper} px-4 py-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className={`mt-0.5 shrink-0 ${t.icon}`} aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className={`text-[14px] font-semibold ${t.title}`}>{title}</p>
          {body && (
            <p className={`mt-1 text-[13px] leading-[1.5] ${t.body}`}>{body}</p>
          )}
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </div>
  );
}
