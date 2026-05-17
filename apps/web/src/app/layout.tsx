import type { Metadata } from 'next';
import { Providers } from '@/providers/providers';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:5000';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'GermanUp — Learn German A1 Grammar',
    template: '%s | GermanUp',
  },
  description:
    'Master German grammar, vocabulary, and verb conjugations with AI-powered exercises. Free A1 course for English speakers.',
  keywords: ['learn German', 'German grammar', 'A1 German', 'German exercises', 'German flashcards'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'GermanUp',
    title: 'GermanUp — Learn German A1 Grammar',
    description:
      'Master German grammar one rule at a time. Grammar exercises, flashcards, and AI correction.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'GermanUp — Learn German A1 Grammar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GermanUp — Learn German A1 Grammar',
    description: 'Master German grammar one rule at a time.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
