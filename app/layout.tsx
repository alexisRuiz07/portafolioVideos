import type { Metadata, Viewport } from 'next';
import { Caprasimo, Figtree } from 'next/font/google';
import './globals.css';

const caprasimo = Caprasimo({ weight: '400', subsets: ['latin'], variable: '--font-caprasimo', display: 'swap' });
const figtree = Figtree({ weight: ['400', '600', '700'], subsets: ['latin'], variable: '--font-figtree', display: 'swap' });

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'thealex — Editor de video',
  description: 'Portafolio de edición de video: Reels, TikTok y YouTube.',
};

export const viewport: Viewport = {
  themeColor: '#F2EFE9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${caprasimo.variable} ${figtree.variable}`}>
      <body>{children}</body>
    </html>
  );
}
