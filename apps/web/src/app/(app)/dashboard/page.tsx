'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useVocab } from '@/hooks/use-vocab';
import { useTodayStats } from '@/hooks/use-progress';
import { Card, CardContent } from '@/components/ui/card';
import { A1_TOPICS } from '@germanup/types';
import { cn } from '@/lib/utils';

const TOPIC_LABELS: Record<string, string> = {
  'praesens': 'Präsens',
  'noun-gender': 'der / die / das',
  'cases': 'Cases (Nom/Akk/Dat)',
  'personal-pronouns': 'Personal Pronouns',
  'possessive-pronouns': 'Possessive Pronouns',
  'modal-verbs': 'Modal Verbs',
  'dativ-prepositions': 'Dativ Prepositions',
  'akkusativ-prepositions': 'Akkusativ Prepositions',
  'two-way-prepositions': 'Two-Way Prepositions',
  'imperative': 'Imperative',
  'separable-verbs': 'Separable Verbs',
  'future-werden': 'Future with werden',
  'numbers-dates-time': 'Numbers / Dates / Time',
};

const QUICK_ACTIONS = [
  { label: 'Flashcards', icon: '🗂️', href: '/vocabulary/flashcards', desc: 'Practice vocabulary' },
  { label: 'Grammar', icon: '📚', href: '/grammar', desc: 'A1 topics' },
  { label: 'Verbs', icon: '📝', href: '/verbs', desc: 'Conjugation practice' },
];

export default function DashboardPage() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const { data: vocabData } = useVocab({ limit: 1 });
  const { data: todayStats } = useTodayStats();
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      void update();
    }
  }, [searchParams, update]);

  // Trigger celebration once when goal is reached
  useEffect(() => {
    if (todayStats?.goalReached && !celebrated) {
      setCelebrated(true);
    }
  }, [todayStats?.goalReached, celebrated]);

  const firstName = session?.user?.name?.split(' ')[0] ?? 'there';
  const totalWords = vocabData?.total ?? 0;
  const isPro =
    session?.user && 'plan' in session.user && session.user.plan === 'PRO';

  const exercisesToday = todayStats?.exercisesToday ?? 0;
  const dailyGoal = todayStats?.dailyGoal ?? 20;
  const goalPct = Math.min(100, Math.round((exercisesToday / dailyGoal) * 100));
  const streakCount = todayStats?.streakCount ?? 0;

  return (
    <div className="max-w-5xl">
      {/* Celebration banner */}
      {celebrated && (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-4 flex items-center gap-3 animate-bounce-once shadow-lg">
          <span className="text-3xl">🎉</span>
          <div>
            <p className="font-bold text-lg">Daily goal reached!</p>
            <p className="text-brand-100 text-sm">You completed {dailyGoal} exercises today. Come back tomorrow to keep your streak!</p>
          </div>
          <button
            onClick={() => setCelebrated(false)}
            className="ml-auto text-brand-100 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hallo, {firstName}! 👋
        </h1>
        <p className="text-gray-500 mt-1">Keep learning — consistency beats intensity.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Vocabulary</p>
            <p className="text-3xl font-bold text-gray-900">{totalWords}</p>
            <p className="text-sm text-gray-500 mt-1">words saved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Streak</p>
            <p className="text-3xl font-bold text-gray-900">
              {streakCount > 0 ? `🔥 ${streakCount}` : '—'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {streakCount === 1 ? '1 day' : streakCount > 1 ? `${streakCount} days` : 'Start today'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Today</p>
            <p className="text-3xl font-bold text-gray-900">
              {exercisesToday}
              <span className="text-lg font-normal text-gray-400"> / {dailyGoal}</span>
            </p>
            <div className="mt-2">
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-500',
                    goalPct >= 100 ? 'bg-green-500' : 'bg-brand-500',
                  )}
                  style={{ width: `${goalPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {goalPct >= 100 ? '✅ Goal reached!' : `${dailyGoal - exercisesToday} to go`}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Plan</p>
            <p className="text-3xl font-bold text-gray-900">
              {isPro ? '⭐ Pro' : 'Free'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {!isPro ? (
                <Link href="/settings" className="text-brand-600 hover:underline">
                  Upgrade to Pro →
                </Link>
              ) : 'All features unlocked'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Streak freeze (Pro only, when available) */}
      {isPro && todayStats?.freezeAvailable && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3 text-sm">
          <span className="text-xl">🧊</span>
          <span className="text-amber-800">
            You have a <strong>streak freeze</strong> available this week — use it if you miss a day.
          </span>
          <button
            className="ml-auto px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600"
            onClick={async () => {
              try {
                const { api } = await import('@/lib/api');
                await api.post('/progress/streak-freeze');
              } catch {
                // ignore
              }
            }}
          >
            Use freeze
          </button>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick start</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-5">
                <div className="text-3xl mb-2">{action.icon}</div>
                <p className="font-semibold text-gray-900">{action.label}</p>
                <p className="text-sm text-gray-500">{action.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* A1 Topic grid */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">A1 Grammar Topics</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {A1_TOPICS.map((topic, i) => (
          <Link
            key={topic}
            href={`/grammar/a1/${topic}`}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-brand-300 transition-all"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded px-1.5 py-0.5">
                {i + 1}
              </span>
              <span className="text-xs text-gray-400">A1</span>
            </div>
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {TOPIC_LABELS[topic] ?? topic}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
