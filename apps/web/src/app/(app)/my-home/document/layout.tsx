import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document a system — Odosan',
  description:
    'Snap the nameplate on your water heater, HVAC, or electrical panel. Claude vision on AWS Bedrock extracts make, model, install date — and flags safety hazards like FPE/Zinsco panels.',
  openGraph: {
    title: 'Document a home system — Odosan',
    description: 'Photo in, structured home record out. Powered by Claude on AWS Bedrock.',
    type: 'website',
  },
};

export default function DocumentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
