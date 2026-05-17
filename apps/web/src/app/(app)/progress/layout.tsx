import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Progress',
  description: 'Track your German learning streak, accuracy per topic, and daily exercise history.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
