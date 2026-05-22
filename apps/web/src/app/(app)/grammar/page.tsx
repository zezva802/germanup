'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { A1_TOPICS, CHALLENGES } from '@germanup/types';
import { useProgress } from '@/hooks/use-progress';
import { getRank, getRankProgress, getNextRankXp } from '@/lib/ranks';

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

export default function GrammarPage() {
  const router = useRouter();
  const { data: progress } = useProgress();

  const topicMap = new Map(progress?.topics.map((t) => [t.topic, t]) ?? []);

  function handleTopicClick(slug: string, index: number) {
    const row = topicMap.get(slug);
    const isUnlocked = row?.unlocked ?? index < 3;
    if (!isUnlocked) return;
    router.push(`/grammar/a1/${slug}`);
  }

  const challengeStatuses = CHALLENGES.map((c) => {
    const totalXp = c.topics.reduce((sum, t) => sum + (topicMap.get(t)?.xp ?? 0), 0);
    const requiredTotal = c.topics.length * c.minXp;
    const allMeet = c.topics.every((t) => (topicMap.get(t)?.xp ?? 0) >= c.minXp);
    return { ...c, isUnlocked: allMeet, totalXp, requiredTotal };
  });

  const hasAnyChallengeProgress = challengeStatuses.some((c) => c.isUnlocked || c.totalXp > 0);

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="mb-7">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
          A1 Grammar
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
          13 topics · complete each to unlock the next
        </p>
      </div>

      {/* Challenges */}
      {hasAnyChallengeProgress && (
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
            Challenges
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {challengeStatuses.map((c) => (
              <Link
                key={c.slug}
                href={`/grammar/challenge/${c.slug}`}
                className="flex items-center gap-3 p-4 rounded-xl transition-colors"
                style={{
                  background: 'var(--s2)',
                  border: `1px solid ${c.isUnlocked ? 'var(--line2)' : 'var(--line)'}`,
                  opacity: c.isUnlocked || c.totalXp > 0 ? 1 : 0.4,
                  pointerEvents: c.isUnlocked || c.totalXp > 0 ? 'auto' : 'none',
                  textDecoration: 'none',
                }}
              >
                <span className="text-2xl shrink-0">{c.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>{c.name}</p>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--s3)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.round((c.totalXp / c.requiredTotal) * 100))}%`,
                        background: 'var(--amber)',
                      }}
                    />
                  </div>
                </div>
                <span style={{ color: c.isUnlocked ? 'var(--green)' : 'var(--text3)', fontSize: 14 }}>
                  {c.isUnlocked ? '→' : '🔒'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Chapter list */}
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
        Topics
      </p>

      <div className="flex flex-col">
        {A1_TOPICS.map((slug, i) => {
          const row = topicMap.get(slug);
          const isUnlocked = row?.unlocked ?? i < 3;
          const xp = row?.xp ?? 0;
          const done = row?.exercisesDone ?? 0;
          const rank = getRank(xp);
          const rankPct = getRankProgress(xp);
          const nextXp = getNextRankXp(xp);
          const isMastered = done > 0 && !nextXp;
          const isInProgress = done > 0 && !isMastered;
          const isLast = i === A1_TOPICS.length - 1;

          return (
            <div key={slug} className="flex items-stretch">
              {/* Timeline */}
              <div className="flex flex-col items-center" style={{ width: 32, flexShrink: 0 }}>
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{
                    width: isInProgress ? 14 : 11,
                    height: isInProgress ? 14 : 11,
                    marginTop: 10,
                    background: isMastered
                      ? 'var(--green)'
                      : isInProgress
                      ? 'var(--amber)'
                      : isUnlocked
                      ? 'var(--s3)'
                      : 'var(--bg)',
                    border: `2px solid ${
                      isMastered
                        ? 'var(--green)'
                        : isInProgress
                        ? 'var(--amber)'
                        : isUnlocked
                        ? 'var(--line2)'
                        : 'var(--line)'
                    }`,
                    boxShadow: isInProgress ? '0 0 0 3px rgba(251,178,36,0.15)' : 'none',
                  }}
                >
                  {isMastered && (
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                {!isLast && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 10,
                      margin: '2px 0',
                      background: isMastered ? 'rgba(74,222,128,0.2)' : 'var(--line)',
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <button
                onClick={() => handleTopicClick(slug, i)}
                disabled={!isUnlocked}
                className="flex-1 text-left pb-4 pl-3 flex items-start justify-between gap-3 disabled:cursor-not-allowed"
              >
                <div className="flex-1 min-w-0 pt-1.5">
                  <p
                    className="text-sm font-semibold mb-1.5 leading-tight"
                    style={{ color: isUnlocked ? 'var(--text)' : 'var(--text3)' }}
                  >
                    <span className="text-[10px] font-bold mr-2" style={{ color: 'var(--text3)' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {TOPIC_LABELS[slug] ?? slug}
                  </p>
                  {isUnlocked && (
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--s3)', width: 120 }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${done > 0 ? Math.round(rankPct * 100) : 0}%`,
                          background: isMastered ? 'var(--green)' : isInProgress ? 'var(--amber)' : 'var(--line2)',
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-1.5 shrink-0">
                  {isMastered && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--green)' }}>
                      Mastered 🏆
                    </span>
                  )}
                  {isInProgress && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(251,178,36,0.1)', color: 'var(--amber)' }}>
                      {rank.name} · {xp} XP{nextXp ? ` · ${nextXp - xp} to next` : ''}
                    </span>
                  )}
                  {isUnlocked && !done && (
                    <span className="text-[11px] font-semibold" style={{ color: 'var(--text3)' }}>
                      Not started →
                    </span>
                  )}
                  {!isUnlocked && (
                    <span className="text-[11px]" style={{ color: 'var(--text3)' }}>🔒</span>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
