'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { A1_TOPICS } from '@germanup/types';
import { useProgress } from '@/hooks/use-progress';
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

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">A1 Grammar</h1>
        <p className="text-gray-500 mt-1">
          13 topics · Complete each to unlock the next
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {A1_TOPICS.map((slug, index) => {
          const isFirstThree = index < 3;
          const row = topicMap.get(slug);
          const isUnlocked = row?.unlocked ?? isFirstThree;
          const pct = row?.percentCorrect ?? 0;
          const done = row?.exercisesDone ?? 0;

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

              {/* Topic number badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded px-2 py-0.5">
                  {index + 1}
                </span>
                <span className="text-lg">{TOPIC_ICONS[slug]}</span>
              </div>

              <p className="font-semibold text-gray-900 text-sm mb-3">
                {TOPIC_LABELS[slug] ?? slug}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    pct >= 80
                      ? 'bg-green-500'
                      : pct >= 40
                        ? 'bg-brand-500'
                        : 'bg-gray-300',
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-gray-400">
                  {done > 0 ? `${done} exercises done` : isUnlocked ? 'Not started' : 'Locked'}
                </span>
                {done > 0 && (
                  <span
                    className={cn(
                      'text-xs font-medium',
                      pct >= 80 ? 'text-green-600' : 'text-brand-600',
                    )}
                  >
                    {pct}%
                  </span>
                )}
              </div>

              {!isUnlocked && (
                <p className="text-xs text-gray-400 mt-2">
                  Complete topic {index} to unlock
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
