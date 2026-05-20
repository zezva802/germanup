'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { A1_TOPICS, CHALLENGES } from '@germanup/types';
import { useProgress } from '@/hooks/use-progress';
import { getRank, getRankProgress, getNextRankXp } from '@/lib/ranks';
import { cn } from '@/lib/utils';

const TOPIC_LABELS: Record<string, string> = {
  praesens: 'Präsens',
  'noun-gender': 'der / die / das',
  cases: 'Cases (Nom/Akk/Dat)',
  'personal-pronouns': 'Personal Pronouns',
  'possessive-pronouns': 'Possessive Pronouns',
  'modal-verbs': 'Modal Verbs',
  'dativ-prepositions': 'Dativ Prepositions',
  'akkusativ-prepositions': 'Akkusativ Prepositions',
  'two-way-prepositions': 'Two-Way Prepositions',
  imperative: 'Imperative',
  'separable-verbs': 'Separable Verbs',
  'future-werden': 'Future with werden',
  'numbers-dates-time': 'Numbers / Dates / Time',
};

const TOPIC_ICONS: Record<string, string> = {
  praesens: '⏰',
  'noun-gender': '🏷️',
  cases: '📦',
  'personal-pronouns': '👤',
  'possessive-pronouns': '👥',
  'modal-verbs': '🎯',
  'dativ-prepositions': '📍',
  'akkusativ-prepositions': '➡️',
  'two-way-prepositions': '↔️',
  imperative: '❗',
  'separable-verbs': '✂️',
  'future-werden': '🔮',
  'numbers-dates-time': '🔢',
};

export default function GrammarPage() {
  const router = useRouter();
  const { data: progress } = useProgress();

  const topicMap = new Map(progress?.topics.map((t) => [t.topic, t]) ?? []);

  function handleTopicClick(slug: string, index: number) {
    const isFirstThree = index < 3;
    const row = topicMap.get(slug);
    const isUnlocked = row?.unlocked ?? isFirstThree;

    if (!isUnlocked) return;
    router.push(`/grammar/a1/${slug}`);
  }

  const challengeStatuses = CHALLENGES.map((c) => {
    const allMeet = c.topics.every((t) => {
      const row = topicMap.get(t);
      return (row?.xp ?? 0) >= c.minXp;
    });
    const totalXp = c.topics.reduce((sum, t) => sum + (topicMap.get(t)?.xp ?? 0), 0);
    const requiredTotal = c.topics.length * c.minXp;
    return { ...c, isUnlocked: allMeet, totalXp, requiredTotal };
  });

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">A1 Grammar</h1>
        <p className="text-gray-500 mt-1">
          13 topics · Complete each to unlock the next
        </p>
      </div>

      {/* Challenges */}
      {challengeStatuses.some((c) => c.isUnlocked || c.totalXp > 0) && (
        <div className="mb-10">
          <h2 className="font-semibold text-gray-900 mb-3">Challenges</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {challengeStatuses.map((c) => (
              <Link
                key={c.slug}
                href={`/grammar/challenge/${c.slug}`}
                className={cn(
                  'flex items-center gap-4 p-4 bg-white border rounded-xl transition-all',
                  c.isUnlocked
                    ? 'border-brand-200 hover:shadow-md hover:border-brand-400 cursor-pointer'
                    : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed pointer-events-none',
                )}
              >
                <span className="text-3xl">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500 truncate">{c.description}</p>
                  <div className="w-full bg-gray-100 rounded-full h-1 mt-2">
                    <div
                      className="h-1 rounded-full bg-brand-500 transition-all"
                      style={{ width: `${Math.min(100, Math.round((c.totalXp / c.requiredTotal) * 100))}%` }}
                    />
                  </div>
                </div>
                {c.isUnlocked
                  ? <span className="text-brand-600 text-lg shrink-0">→</span>
                  : <span className="text-gray-400 text-lg shrink-0">🔒</span>
                }
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {A1_TOPICS.map((slug, index) => {
          const isFirstThree = index < 3;
          const row = topicMap.get(slug);
          const isUnlocked = row?.unlocked ?? isFirstThree;
          const xp = row?.xp ?? 0;
          const done = row?.exercisesDone ?? 0;
          const rank = getRank(xp);
          const rankPct = getRankProgress(xp);
          const nextXp = getNextRankXp(xp);

          return (
            <button
              key={slug}
              onClick={() => handleTopicClick(slug, index)}
              disabled={!isUnlocked}
              className={cn(
                'relative text-left bg-white border rounded-xl p-5 transition-all',
                isUnlocked
                  ? 'border-gray-200 hover:shadow-md hover:border-brand-300 cursor-pointer'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60',
              )}
            >
              {/* Lock icon */}
              {!isUnlocked && (
                <span className="absolute top-4 right-4 text-gray-400 text-lg">🔒</span>
              )}

              {/* Topic number + rank badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded px-2 py-0.5">
                    {index + 1}
                  </span>
                  <span className="text-lg">{TOPIC_ICONS[slug]}</span>
                </div>
                {isUnlocked && (
                  <span className="text-base" title={rank.name}>{rank.emoji}</span>
                )}
              </div>

              <p className="font-semibold text-gray-900 text-sm mb-3">
                {TOPIC_LABELS[slug] ?? slug}
              </p>

              {/* XP progress bar within current rank */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                <div
                  className="h-1.5 rounded-full bg-brand-500 transition-all"
                  style={{ width: isUnlocked ? `${Math.round(rankPct * 100)}%` : '0%' }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400">
                  {done > 0 ? `${xp} XP · ${rank.name}` : isUnlocked ? 'Not started' : 'Locked'}
                </span>
                {done > 0 && nextXp && (
                  <span className="text-xs text-gray-400">{nextXp - xp} XP to next rank</span>
                )}
                {done > 0 && !nextXp && (
                  <span className="text-xs text-green-600 font-medium">Mastered</span>
                )}
              </div>

              {!isUnlocked && (
                <p className="text-xs text-gray-400 mt-2">
                  Reach Learner rank in topic {index} to unlock
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
