import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My home — Odosan',
  description:
    "Document your home's systems in seconds. Snap a photo of any nameplate; we extract age, lifespan, replacement cost, and rebates so you know what's due and what it'll cost.",
  openGraph: {
    title: 'My home — Odosan',
    description:
      "Snap a photo. Know what's due, what it costs, and which rebates apply. Your home's health, fully understood.",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My home — Odosan',
    description:
      "Snap a photo. Know what's due, what it costs, and which rebates apply.",
  },
};

export default function MyHomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
