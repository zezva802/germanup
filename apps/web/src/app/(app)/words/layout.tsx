import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Words',
  description: 'Manage your German vocabulary and verbs in one place.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
