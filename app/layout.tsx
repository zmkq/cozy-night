import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito, Cairo } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ChristmasBackground } from '@/components/christmas/ChristmasBackground';
import { PWAInstallPrompt } from '@/components/christmas/PWAInstallPrompt';

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-fredoka',
});

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
});

import config from '@/data/config.json';

export const metadata: Metadata = {
  title: `${config.event.appName} 🎄`,
  description: `The Official ${config.event.eventTitle} Summit. Join the chaos, games, and memories.`,
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.png' }, { url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-touch-icon.png',
    shortcut: '/icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: config.event.appName,
  },
  openGraph: {
    title: `${config.event.appName} 🎄`,
    description: `The Official ${config.event.eventTitle} Summit. Are you ready?`,
    siteName: config.event.appName,
    images: [
      {
        url: '/icons/icon-512x512.png', // Using the largest icon we generated
        width: 512,
        height: 512,
        alt: `${config.event.appName} Logo`,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: `${config.event.appName} 🎄`,
    description: `The Official ${config.event.eventTitle} Summit. Are you ready?`,
    images: ['/icons/icon-512x512.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a12',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fredoka.variable} ${nunito.variable} ${cairo.variable} font-sans antialiased text-white`}>
        <ChristmasBackground />
        <div className="noise-overlay" aria-hidden="true" />
        <main className="relative z-10 flex flex-col min-h-screen overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <PWAInstallPrompt />
        <Toaster />
      </body>
    </html>
  );
}
