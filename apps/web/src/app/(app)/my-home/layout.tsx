import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My home — Odosan',
  description:
    'A lightweight record of your home’s health. Saved diagnoses, scanned systems — refer back any time.',
  openGraph: {
    title: 'My home — Odosan',
    description: 'A lightweight record of your home’s health that grows over time.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'My home — Odosan',
    description: 'A lightweight record of your home’s health that grows over time.',
  },
};

export default function MyHomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
