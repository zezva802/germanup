'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTodayStats, useProgress } from '@/hooks/use-progress';
import { useWordsStats } from '@/hooks/use-review';
import { ReviewsDueCard } from '@/components/words/reviews-due-card';
import { A1_TOPICS } from '@germanup/types';

const TOPIC_LABELS: Record<string, string> = {
  'praesens':               'Präsens',
  'noun-gender':            'der / die / das',
  'cases':                  'Cases (Nom/Akk/Dat)',
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

export default function DashboardPage() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const { data: wordsStats } = useWordsStats();
  const { data: todayStats } = useTodayStats();
  const { data: progress } = useProgress();
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') void update();
  }, [searchParams, update]);

  useEffect(() => {
    if (todayStats?.goalReached && !celebrated) setCelebrated(true);
  }, [todayStats?.goalReached, celebrated]);

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';
  const totalWords = wordsStats?.totalWords ?? 0;
  const exercisesToday = todayStats?.exercisesToday ?? 0;
  const dailyGoal = todayStats?.dailyGoal ?? 20;
  const goalPct = Math.min(100, Math.round((exercisesToday / dailyGoal) * 100));
  const streakCount = todayStats?.streakCount ?? 0;
  const isPro = session?.user && 'plan' in session.user && session.user.plan === 'PRO';

  const topicMap = new Map(progress?.topics.map((t) => [t.topic, t]) ?? []);
  const currentSlug = A1_TOPICS.find((t) => {
    const p = topicMap.get(t);
    return p?.unlocked && p.rank !== 'master';
  }) ?? A1_TOPICS[0];
  const currentTopic = topicMap.get(currentSlug);
  const currentLabel = TOPIC_LABELS[currentSlug] ?? currentSlug;

  const day = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div style={{ maxWidth: 780 }}>

      {/* Celebration banner */}
      {celebrated && (
        <div
          className="mb-6 rounded-xl px-5 py-4 flex items-center gap-3"
          style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}
        >
          <span className="text-xl">🎉</span>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--green)' }}>Daily goal reached!</p>
            <p className="text-xs" style={{ color: 'var(--text2)' }}>
              You completed {dailyGoal} exercises today. Come back tomorrow!
            </p>
          </div>
          <button
            onClick={() => setCelebrated(false)}
            className="ml-auto text-lg leading-none"
            style={{ color: 'var(--text3)' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Greeting */}
      <p
        className="text-[11px] font-semibold uppercase tracking-widest mb-1.5"
        style={{ color: 'var(--text3)' }}
      >
        {day}
      </p>
      <h1
        className="text-[28px] font-black tracking-tight mb-7"
        style={{ color: 'var(--text)' }}
      >
        Hallo, {firstName} 👋
      </h1>

      {/* Focus card */}
      <div
        className="rounded-2xl p-6 mb-4 relative overflow-hidden"
        style={{ background: 'var(--s2)', border: '1px solid var(--line2)' }}
      >
        {/* subtle glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 100% 0%, rgba(74,222,128,0.06) 0%, transparent 60%)',
          }}
        />
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-2"
          style={{ color: 'var(--green)' }}
        >
          Continue where you left off
        </p>
        <p
          className="text-xl font-black tracking-tight mb-1"
          style={{ color: 'var(--text)' }}
        >
          {currentLabel}
        </p>
        <p className="text-[12.5px] mb-5" style={{ color: 'var(--text2)' }}>
          {currentTopic
            ? `${currentTopic.rank} rank · ${currentTopic.xp} XP · keep going to reach the next rank`
            : 'Start your first topic'}
        </p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'var(--text3)' }}>
              <span>Today&apos;s goal</span>
              <span>{exercisesToday} / {dailyGoal}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${goalPct}%`, background: 'var(--green)' }}
              />
            </div>
          </div>
          <Link
            href={`/grammar/a1/${currentSlug}`}
            className="shrink-0 px-5 py-2.5 rounded-lg text-[13px] font-bold transition-opacity hover:opacity-85"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            Start Practice →
          </Link>
        </div>
      </div>

      {/* Reviews due today (Words rework) */}
      <ReviewsDueCard />

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-8">
        {[
          { label: 'day streak', value: streakCount > 0 ? streakCount : '—', color: 'var(--amber)', suffix: streakCount > 0 ? ' 🔥' : '' },
          { label: 'words learned', value: totalWords, color: 'var(--text)', suffix: '' },
          { label: 'total XP', value: (progress?.totalXp ?? 0).toLocaleString(), color: 'var(--text)', suffix: '' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
          >
            <p
              className="text-[26px] font-black tracking-tight leading-none mb-1"
              style={{ color: s.color }}
            >
              {s.value}{s.suffix}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-3"
        style={{ color: 'var(--text3)' }}
      >
        Quick actions
      </p>
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { icon: '🃏', name: 'Reviews', desc: 'Study your due cards', href: '/words/study' },
          { icon: '⏱', name: 'Verb Drills', desc: 'Conjugation practice', href: '/verbs' },
          {
            icon: '✨',
            name: isPro ? 'AI Correction' : 'Upgrade to Pro',
            desc: isPro ? 'Free write + correction' : 'Unlock AI features',
            href: isPro ? '/grammar' : '/pricing',
          },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-xl p-4 block transition-colors"
            style={{ background: 'var(--s2)', border: '1px solid var(--line)', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--line2)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
          >
            <p className="text-base mb-2">{a.icon}</p>
            <p className="text-[13px] font-bold mb-0.5" style={{ color: 'var(--text)' }}>{a.name}</p>
            <p className="text-[11.5px]" style={{ color: 'var(--text3)' }}>{a.desc}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}
