import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vocabulary',
  description: 'Manage your German vocabulary and practice with AI-powered flashcards.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
