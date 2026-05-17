'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useState } from 'react';
import { useSidebar } from './sidebar-context';

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const { toggle: toggleSidebar } = useSidebar();

  return (
    <header className="h-14 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-200">
      {/* Hamburger — mobile only */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="hidden md:block" />
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt="avatar"
              width={28}
              height={28}
              className="rounded-full"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
              {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase()}
            </div>
          )}
          <span className="hidden md:block">{session?.user?.name ?? session?.user?.email}</span>
          {session?.user && 'plan' in session.user && session.user.plan === 'PRO' && (
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">
              Pro
            </span>
          )}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
            <button
              onClick={() => void signOut({ callbackUrl: '/' })}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
