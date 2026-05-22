'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { A1_TOPICS } from '@germanup/types';
import { cn } from '@/lib/utils';
import { TheoryContent } from './theory-content';
import { PracticeTab } from './practice-tab';
import { VisualTab } from './visual-tab';
import { useTopicProgress } from '@/hooks/use-progress';
import { getRank, getNextRankXp } from '@/lib/ranks';

const VISUAL_TOPICS = new Set(['dativ-prepositions', 'akkusativ-prepositions', 'two-way-prepositions']);

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

type Tab = 'theory' | 'visual' | 'practice';

export default function TopicPage({ params }: { params: { topic: string } }) {
  const { topic } = params;

  if (!A1_TOPICS.includes(topic as (typeof A1_TOPICS)[number])) notFound();

  const hasVisual = VISUAL_TOPICS.has(topic);
  const [activeTab, setActiveTab] = useState<Tab>('theory');
  const { data: progress } = useTopicProgress(topic);

  const topicIndex = A1_TOPICS.indexOf(topic as (typeof A1_TOPICS)[number]);
  const isUnlocked = progress?.unlocked ?? topicIndex < 3;
  const done = progress?.exercisesDone ?? 0;
  const xp = progress?.xp ?? 0;
  const rank = getRank(xp);
  const nextXp = getNextRankXp(xp);

  if (!isUnlocked) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-xl font-black mb-2" style={{ color: 'var(--text)' }}>Topic Locked</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>
          Complete topic {topicIndex} to unlock{' '}
          <strong style={{ color: 'var(--text)' }}>{TOPIC_LABELS[topic] ?? topic}</strong>.
        </p>
        <Link
          href="/grammar"
          className="inline-block px-5 py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-85"
          style={{ background: 'var(--green)', color: 'var(--bg)' }}
        >
          Back to Grammar
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-5" style={{ color: 'var(--text3)' }}>
        <Link href="/grammar" className="transition-colors hover:text-[var(--text2)]" style={{ color: 'var(--text3)' }}>
          Grammar
        </Link>
        <span>/</span>
        <span>A1</span>
        <span>/</span>
        <span style={{ color: 'var(--text2)' }}>{TOPIC_LABELS[topic] ?? topic}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--green)' }}
            >
              {topicIndex + 1}
            </span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>A1</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {TOPIC_LABELS[topic] ?? topic}
          </h1>
        </div>

        {done > 0 && (
          <div className="text-right">
            <p className="text-xl">{rank.emoji}</p>
            <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>{rank.name}</p>
            <p className="text-xs" style={{ color: 'var(--text3)' }}>
              {xp} XP{nextXp ? ` · ${nextXp - xp} to next` : ''}
            </p>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-lg w-fit"
        style={{ background: 'var(--s2)' }}
      >
        {(['theory', ...(hasVisual ? ['visual'] : []), 'practice'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-1.5 rounded-md text-sm font-semibold capitalize transition-all',
            )}
            style={
              activeTab === tab
                ? { background: 'var(--s3)', color: 'var(--text)', border: '1px solid var(--line2)' }
                : { color: 'var(--text3)', background: 'transparent', border: '1px solid transparent' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={activeTab === 'theory' ? '' : 'hidden'}>
        <TheoryContent topic={topic} />
      </div>
      {hasVisual && (
        <div className={activeTab === 'visual' ? '' : 'hidden'}>
          <VisualTab topic={topic} />
        </div>
      )}
      <div className={activeTab === 'practice' ? '' : 'hidden'}>
        <PracticeTab topic={topic} />
      </div>
    </div>
  );
}
