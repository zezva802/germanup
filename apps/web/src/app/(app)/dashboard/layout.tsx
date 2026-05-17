import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your German learning dashboard — daily streak, progress, and quick access to all exercises.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
