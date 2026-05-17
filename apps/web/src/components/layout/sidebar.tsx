'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSidebar } from './sidebar-context';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/vocabulary', label: 'Vocabulary', icon: '🗂️' },
  { href: '/verbs', label: 'Verbs', icon: '📝' },
  { href: '/grammar', label: 'Grammar', icon: '📚' },
  { href: '/progress', label: 'Progress', icon: '📊' },
  { href: '/pricing', label: 'Pricing', icon: '⭐' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
  { href: '/admin/exercises', label: 'Admin', icon: '🛠️' },
];

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <Link
        href="/dashboard"
        onClick={onLinkClick}
        className="px-6 mb-8 text-xl font-bold text-brand-600"
      >
        GermanUp
      </Link>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function Sidebar() {
  const { open, close } = useSidebar();

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-gray-200 py-6">
        <SidebarContent />
      </aside>

      {/* Mobile overlay backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 flex flex-col w-64 h-full bg-white border-r border-gray-200 py-6 transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent onLinkClick={close} />
      </aside>
    </>
  );
}
