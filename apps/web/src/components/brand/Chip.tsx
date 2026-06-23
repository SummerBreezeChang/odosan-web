import type { ReactNode } from 'react';

export type ChipTone = 'good' | 'soon' | 'urgent' | 'neutral' | 'leaf';

const TONE: Record<ChipTone, string> = {
  good: 'bg-od-green-soft text-od-green',
  soon: 'bg-od-orange-soft text-od-orange',
  urgent: 'bg-od-red-soft text-od-red',
  neutral: 'bg-od-track text-od-muted',
  leaf: 'bg-od-primary-soft text-od-leaf',
};

/**
 * Chip — pill with a tinted background + same-family dark text. One
 * component handles severity, confidence, and category labels.
 */
export function Chip({
  tone = 'neutral',
  children,
  className = '',
}: {
  tone?: ChipTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Pick the chip tone for a diagnosis severity. */
export function severityTone(severity: 'urgent' | 'soon' | 'monitor'): ChipTone {
  if (severity === 'urgent') return 'urgent';
  if (severity === 'soon') return 'soon';
  return 'good';
}

/** Pick the chip tone for a 0-100 confidence score. */
export function confidenceTone(confidence: number): ChipTone {
  if (confidence >= 75) return 'good';
  if (confidence >= 50) return 'soon';
  return 'urgent';
}
