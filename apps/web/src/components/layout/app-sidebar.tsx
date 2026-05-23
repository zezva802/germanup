'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProgress } from '@/hooks/use-progress';
import { A1_TOPICS } from '@germanup/types';
import { cn } from '@/lib/utils';

const TOPIC_LABELS: Record<string, string> = {
  'praesens':               'Präsens',
  'noun-gender':            'der / die / das',
  'cases':                  'Cases',
  'personal-pronouns':      'Personal Pronouns',
  'possessive-pronouns':    'Possessive Pronouns',
  'modal-verbs':            'Modal Verbs',
  'dativ-prepositions':     'Dativ Prepositions',
  'akkusativ-prepositions': 'Akkusativ Prepositions',
  'two-way-prepositions':   'Two-Way Prepositions',
  'imperative':             'Imperative',
  'separable-verbs':        'Separable Verbs',
  'future-werden':          'Future with werden',
  'numbers-dates-time':     'Numbers / Dates / Time',
};

const NAV = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/words',
    label: 'Words',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
  },
  {
    href: '/grammar',
    label: 'Grammar',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Progress',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" x2="18" y1="20" y2="10"/>
        <line x1="12" x2="12" y1="20" y2="4"/>
        <line x1="6" x2="6" y1="20" y2="14"/>
      </svg>
    ),
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { data: progress } = useProgress();

  const topicMap = new Map(progress?.topics.map((t) => [t.topic, t]) ?? []);

  const currentSlug = A1_TOPICS.find((t) => {
    const p = topicMap.get(t);
    return p?.unlocked && p.rank !== 'master';
  });

  return (
    <aside
      className="hidden md:flex flex-col shrink-0 overflow-y-auto theme-transition"
      style={{
        width: 240,
        background: 'var(--tint-side)',
        borderRight: '1px solid var(--line)',
      }}
    >
      {/* Nav links */}
      <div className="p-2.5 pb-0">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1"
          style={{ color: 'var(--text3)' }}
        >
          Navigate
        </p>
        {NAV.map((item) => {
          const active =
            item.href === '/words'
              ? pathname.startsWith('/words') || pathname.startsWith('/vocabulary') || pathname.startsWith('/verbs')
              : pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] font-medium relative accent-transition',
              )}
              style={{
                color: active ? 'var(--accent)' : 'var(--text2)',
                background: active ? 'var(--accent-bg)' : 'transparent',
                fontWeight: active ? 600 : 500,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'var(--s2)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Left accent indicator */}
              {active && (
                <span
                  className="accent-transition"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: 3,
                    borderRadius: 99,
                    background: 'var(--accent)',
                  }}
                />
              )}
              <span style={{ opacity: active ? 1 : 0.55 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--line)', margin: '10px 10px 14px' }} />

      {/* A1 Journey */}
      <div className="flex-1 px-2.5 pb-4">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2"
          style={{ color: 'var(--text3)' }}
        >
          A1 Journey
        </p>

        {A1_TOPICS.map((slug, i) => {
          const p = topicMap.get(slug);
          const isDone = p?.unlocked && (p.rank === 'master' || (p.xp ?? 0) >= 200);
          const isCurrent = slug === currentSlug;
          const isLast = i === A1_TOPICS.length - 1;

          return (
            <div key={slug} className="flex items-stretch">
              {/* dot + line */}
              <div className="flex flex-col items-center" style={{ width: 20, flexShrink: 0 }}>
                <div
                  className="rounded-full shrink-0"
                  style={{
                    width: isCurrent ? 12 : 10,
                    height: isCurrent ? 12 : 10,
                    marginTop: 4,
                    background: isDone
                      ? 'var(--green)'
                      : isCurrent
                      ? 'var(--amber)'
                      : 'var(--bg)',
                    border: `1.5px solid ${
                      isDone ? 'var(--green)' : isCurrent ? 'var(--amber)' : 'var(--line2)'
                    }`,
                    boxShadow: isCurrent ? '0 0 0 3px rgba(251,178,36,0.15)' : 'none',
                  }}
                />
                {!isLast && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 8,
                      margin: '2px 0',
                      background: isDone ? 'rgba(74,222,128,0.2)' : 'var(--line)',
                    }}
                  />
                )}
              </div>

              {/* label */}
              <Link
                href={`/grammar/a1/${slug}`}
                className="flex-1 pb-2.5 pl-2"
                style={{ textDecoration: 'none' }}
              >
                <span
                  className="text-[12px] block leading-snug px-1 py-0.5 rounded transition-colors"
                  style={{
                    color: isDone
                      ? 'var(--text)'
                      : isCurrent
                      ? 'var(--text)'
                      : 'var(--text3)',
                    fontWeight: isCurrent ? 600 : 500,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--s2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {TOPIC_LABELS[slug] ?? slug}
                  {isCurrent && (
                    <span className="ml-1" style={{ color: 'var(--amber)' }}>←</span>
                  )}
                </span>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Upgrade footer */}
      <div style={{ borderTop: '1px solid var(--line)', padding: '10px' }}>
        <Link
          href="/pricing"
          className="flex items-center gap-2 px-2.5 py-2 rounded-lg w-full transition-colors"
          style={{
            background: 'rgba(74,222,128,0.06)',
            border: '1px solid rgba(74,222,128,0.12)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = 'rgba(74,222,128,0.1)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = 'rgba(74,222,128,0.06)')
          }
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: 'var(--green)', flexShrink: 0 }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <div>
            <p className="text-[12px] font-bold" style={{ color: 'var(--green)' }}>
              Upgrade to Pro
            </p>
            <p className="text-[10.5px]" style={{ color: 'var(--text3)' }}>
              AI correction + unlimited
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
