'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useTodayStats } from '@/hooks/use-progress';

export function TopStrip() {
  const { data: session } = useSession();
  const { data: todayStats } = useTodayStats();
  const [menuOpen, setMenuOpen] = useState(false);

  const streak = todayStats?.streakCount ?? 0;
  const initial =
    session?.user?.name?.[0]?.toUpperCase() ??
    session?.user?.email?.[0]?.toUpperCase() ??
    '?';

  return (
    <div
      className="h-11 flex items-center shrink-0 sticky top-0 z-50"
      style={{ background: 'var(--s1)', borderBottom: '1px solid var(--line)' }}
    >
      {/* Logo zone — same width as sidebar */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-4 h-full shrink-0"
        style={{ width: 240, borderRight: '1px solid var(--line)' }}
      >
        <div
          className="w-5 h-5 rounded grid place-items-center text-[10px]"
          style={{ background: 'var(--green)', borderRadius: 4 }}
        >
          🇩🇪
        </div>
        <span className="font-bold text-[13.5px] tracking-tight" style={{ color: 'var(--text)' }}>
          GermanUp
        </span>
      </Link>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2 px-4">
        {streak > 0 && (
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: 'rgba(251,178,36,0.1)',
              border: '1px solid rgba(251,178,36,0.2)',
              color: 'var(--amber)',
            }}
          >
            🔥 {streak}-day streak
          </div>
        )}

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-6 h-6 rounded-full grid place-items-center text-[9.5px] font-black"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="avatar"
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              initial
            )}
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-9 w-44 py-1 rounded-xl z-50"
              style={{
                background: 'var(--s2)',
                border: '1px solid var(--line2)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <div className="px-3 py-2 text-[11px] truncate" style={{ color: 'var(--text3)' }}>
                {session?.user?.email}
              </div>
              <div style={{ height: 1, background: 'var(--line)', margin: '2px 0' }} />
              <button
                onClick={() => void signOut({ callbackUrl: '/' })}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{ color: 'var(--text2)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text2)')}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
