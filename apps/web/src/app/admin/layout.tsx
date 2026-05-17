import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (adminEmail && (session.user as { email?: string })?.email !== adminEmail) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
        <span className="font-bold text-gray-900">GermanUp Admin</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin/exercises" className="text-brand-600 hover:underline font-medium">
            Exercises
          </Link>
        </nav>
        <Link href="/dashboard" className="ml-auto text-sm text-gray-500 hover:text-gray-700">
          ← Back to app
        </Link>
      </header>
      <main className="p-6 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
