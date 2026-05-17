import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verb Conjugation',
  description: 'Import German verbs and practice Präsens and Imperfekt conjugations.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
