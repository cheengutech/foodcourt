import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Food Court',
  description: 'Hang out with strangers. No agenda.',
  openGraph: {
    title: 'Food Court',
    description: 'A space for purposeless presence. Hang out with strangers, no agenda required.',
    url: 'https://foodcourt-pi.vercel.app',
    siteName: 'Food Court',
    images: [
      {
        url: 'https://foodcourt-pi.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Food Court – ambient social presence',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Food Court',
    description: 'A space for purposeless presence. Hang out with strangers, no agenda required.',
    images: ['https://foodcourt-pi.vercel.app/og-image.png'],
  },
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'auto' }}>{children}</body>
    </html>
  );
}
