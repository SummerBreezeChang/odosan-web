import type { HTMLAttributes } from 'react';

/**
 * Card — translucent white with a hairline border and a soft two-layer
 * shadow. Replaces the flat-white-with-gray-border cards across the app.
 * Pi-inspired: low contrast, warm, content-forward.
 */
export function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[18px] border border-od-border bg-white/60 p-[18px] shadow-[0_1px_2px_rgba(27,56,42,0.05),0_10px_26px_rgba(27,56,42,0.06)] ${className}`}
      {...props}
    />
  );
}
