import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Grammar',
  description: 'All 13 A1 German grammar topics with theory and practice exercises.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
