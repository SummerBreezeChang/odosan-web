import type React from 'react';

// Root layout already provides SiteHeader + SiteFooter. This group exists only
// to scope route-level metadata or future per-section providers; pass children
// through untouched.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
