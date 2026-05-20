'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CHALLENGES } from '@germanup/types';
import { useProgress } from '@/hooks/use-progress';
import { getRank } from '@/lib/ranks';
import { PracticeTab } from '../../a1/[topic]/practice-tab';
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

export default function ChallengePage({ params }: { params: { slug: string } }) {
  const challenge = CHALLENGES.find((c) => c.slug === params.slug);
  if (!challenge) notFound();

  const { data: progress } = useProgress();
  const [started, setStarted] = useState(false);

  const topicMap = new Map(progress?.topics.map((t) => [t.topic, t]) ?? []);

  const topicStatuses = challenge.topics.map((t) => {
    const row = topicMap.get(t);
    const xp = row?.xp ?? 0;
    return { topic: t, xp, unlocked: row?.unlocked ?? false, meets: xp >= challenge.minXp };
  });

  const isUnlocked = topicStatuses.every((s) => s.meets);
  const requiredRank = getRank(challenge.minXp);

  if (started && isUnlocked) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/grammar" className="hover:text-brand-600">Grammar</Link>
          <span>/</span>
          <Link href="/grammar" className="hover:text-brand-600">Challenges</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{challenge.name}</span>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{challenge.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{challenge.name}</h1>
            <p className="text-sm text-gray-500">{challenge.description}</p>
          </div>
        </div>

        <PracticeTab topics={challenge.topics as string[]} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/grammar" className="hover:text-brand-600">Grammar</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Challenges</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">{challenge.emoji}</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">{challenge.name}</h1>
          <p className="text-gray-500 mt-1">{challenge.description}</p>
        </div>

        <div className="mb-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Required topics — {requiredRank.emoji} {requiredRank.name} rank ({challenge.minXp} XP) each
          </p>
          <div className="space-y-2">
            {topicStatuses.map((s) => {
              const rank = getRank(s.xp);
              return (
                <div
                  key={s.topic}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl border',
                    s.meets ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50',
                  )}
                >
                  <span className="text-sm font-medium text-gray-800">
                    {TOPIC_LABELS[s.topic] ?? s.topic}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{rank.emoji}</span>
                    <span className={cn('text-sm font-medium', s.meets ? 'text-green-700' : 'text-gray-500')}>
                      {s.xp} XP
                    </span>
                    {s.meets
                      ? <span className="text-green-500 text-sm">✓</span>
                      : <span className="text-xs text-gray-400">{challenge.minXp - s.xp} to go</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isUnlocked ? (
          <button
            onClick={() => setStarted(true)}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Start Challenge
          </button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">
              Reach {requiredRank.emoji} {requiredRank.name} rank in all topics above to unlock
            </p>
            <Link
              href="/grammar"
              className="inline-block px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Grammar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
