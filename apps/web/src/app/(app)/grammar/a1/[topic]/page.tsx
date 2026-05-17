'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { A1_TOPICS } from '@germanup/types';
import { cn } from '@/lib/utils';
import { TheoryContent } from './theory-content';
import { PracticeTab } from './practice-tab';
import { useTopicProgress } from '@/hooks/use-progress';

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

type Tab = 'theory' | 'practice';

export default function TopicPage({ params }: { params: { topic: string } }) {
  const { topic } = params;

  if (!A1_TOPICS.includes(topic as (typeof A1_TOPICS)[number])) {
    notFound();
  }

  const [activeTab, setActiveTab] = useState<Tab>('theory');
  const { data: progress } = useTopicProgress(topic);

  const topicIndex = A1_TOPICS.indexOf(topic as (typeof A1_TOPICS)[number]);
  const isFirstThree = topicIndex < 3;
  const isUnlocked = progress?.unlocked ?? isFirstThree;
  const pct = progress?.percentCorrect ?? 0;
  const done = progress?.exercisesDone ?? 0;

  if (!isUnlocked) {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Topic Locked</h1>
        <p className="text-gray-500 mb-6">
          Complete topic {topicIndex} to unlock{' '}
          <strong>{TOPIC_LABELS[topic] ?? topic}</strong>.
        </p>
        <Link
          href="/grammar"
          className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700"
        >
          Back to Grammar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/grammar" className="hover:text-brand-600">
          Grammar
        </Link>
        <span>/</span>
        <span>A1</span>
        <span>/</span>
        <span className="text-gray-700 font-medium">{TOPIC_LABELS[topic] ?? topic}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-brand-600 bg-brand-50 rounded px-2 py-0.5">
              {topicIndex + 1}
            </span>
            <span className="text-xs text-gray-400">A1</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{TOPIC_LABELS[topic] ?? topic}</h1>
        </div>

        {done > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-brand-600">{pct}%</p>
            <p className="text-xs text-gray-400">{done} exercises</p>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-lg w-fit">
        {(['theory', 'practice'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2 rounded-md text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content — both always mounted so Practice keeps its session state */}
      <div className={activeTab === 'theory' ? '' : 'hidden'}>
        <TheoryContent topic={topic} />
      </div>
      <div className={activeTab === 'practice' ? '' : 'hidden'}>
        <PracticeTab topic={topic} />
      </div>
    </div>
  );
}
