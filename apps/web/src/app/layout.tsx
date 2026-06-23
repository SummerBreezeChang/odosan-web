import type React from 'react';
import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './global.css';
import { Providers } from './providers';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { BottomNav } from '@/components/BottomNav';

// Fraunces — soft optical serif. Display + wordmark only (no body text).
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  weight: ['400', '500', '600'],
  display: 'swap',
});

// Inter — everything else.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Odosan — Your home's dad",
  description:
    'Personalized home maintenance guidance for first-time homeowners. AI diagnosis, fair pricing, vetted local pros.',
  applicationName: 'Odosan',
  appleWebApp: {
    capable: true,
    title: 'Odosan',
    statusBarStyle: 'default',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
  manifest: '/manifest.json',
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4EEE6' },
    { media: '(prefers-color-scheme: dark)', color: '#1B4332' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-od-bg text-od-body antialiased">
        <Providers>
          <SiteHeader />
          {/* Bottom padding reserves space for the persistent BottomNav strip so
              page content doesn't sit under it on mobile. */}
          <main className="flex-1 pb-24 sm:pb-28">{children}</main>
          <SiteFooter />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
