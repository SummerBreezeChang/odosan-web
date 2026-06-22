import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Diagnose — Odosan',
  description:
    "Tell us what's wrong; we'll diagnose, price it fairly, and show you the parts to fix it yourself or pros who can. Photo + AI assessment in under a minute.",
  openGraph: {
    title: 'Diagnose any home problem — Odosan',
    description:
      "Photo + AI. We'll show you the fair price, the parts to DIY it, and the pros to hire.",
    type: 'website',
  },
};

export default function DiagnoseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
