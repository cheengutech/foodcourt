import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Food Court',
  description: 'Hang out with strangers. No agenda.',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>{children}</body>
    </html>
  );
}
