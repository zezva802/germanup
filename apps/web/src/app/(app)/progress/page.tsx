'use client';

import Link from 'next/link';
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

function StreakCalendar({ days }: { days: string[] }) {
  const daySet = new Set(days);
  const cells: { date: string; active: boolean }[] = [];
  const today = new Date();

  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ date: iso, active: daySet.has(iso) });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayIso = today.toISOString().slice(0, 10);

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
    >
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>Activity — last 5 weeks</p>
        <p className="text-xs" style={{ color: 'var(--text3)' }}>Each square = one day</p>
      </div>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={cell.date}
                className="w-3 h-3 rounded-sm"
                style={{
                  background: cell.date === todayIso
                    ? 'var(--green)'
                    : cell.active
                    ? 'rgba(74,222,128,0.3)'
                    : 'var(--s3)',
                  boxShadow: cell.date === todayIso ? '0 0 4px rgba(74,222,128,0.4)' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProgressPage() {
  const { data, isLoading } = useProgress();

  if (isLoading) {
    return (
      <div style={{ maxWidth: 680 }} className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--s2)' }} />
        ))}
      </div>
    );
  }

  const topics = data?.topics ?? [];
  const weakTopics = topics.filter((t) => t.unlocked && t.exercisesDone >= 5 && t.xp < 150);

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="mb-7">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Progress</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>Your A1 German learning journey</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-6">
        {[
          { label: 'day streak', value: data?.streak ?? 0, color: 'var(--amber)', suffix: ' 🔥' },
          { label: 'exercises', value: data?.totalExercisesDone ?? 0, color: 'var(--text)', suffix: '' },
          { label: 'total XP', value: (data?.totalXp ?? 0).toLocaleString(), color: 'var(--text)', suffix: '' },
          { label: 'topics active', value: topics.filter((t) => t.exercisesDone > 0).length, color: 'var(--text)', suffix: '' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
          >
            <p
              className="text-[28px] font-black tracking-tight leading-none mb-1"
              style={{ color: s.color }}
            >
              {s.value}{s.suffix}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <StreakCalendar days={data?.calendarDays ?? []} />

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <div
          className="rounded-xl p-4 mb-6"
          style={{ background: 'rgba(251,178,36,0.06)', border: '1px solid rgba(251,178,36,0.2)' }}
        >
          <p className="text-sm font-bold mb-2" style={{ color: 'var(--amber)' }}>
            Still at Beginner — keep practicing:
          </p>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <Link
                key={t.topic}
                href={`/grammar/a1/${t.topic}`}
                className="text-xs px-2.5 py-1 rounded-lg transition-opacity hover:opacity-75"
                style={{ background: 'rgba(251,178,36,0.1)', color: 'var(--amber)' }}
              >
                {TOPIC_LABELS[t.topic] ?? t.topic} · {t.xp} XP
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Topic rows */}
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text3)' }}>
        A1 Topics
      </p>
      <div className="flex flex-col gap-1.5">
        {topics.map((t) => {
          const rank = getRank(t.xp);
          const rankPct = getRankProgress(t.xp);
          const nextXp = getNextRankXp(t.xp);
          const isMastered = t.exercisesDone > 0 && !nextXp;

          return (
            <Link
              key={t.topic}
              href={t.unlocked ? `/grammar/a1/${t.topic}` : '#'}
              className="flex items-center gap-4 px-4 py-3 rounded-xl transition-colors"
              style={{
                background: 'var(--s2)',
                border: `1px solid ${isMastered ? 'rgba(74,222,128,0.2)' : 'var(--line)'}`,
                opacity: t.unlocked ? 1 : 0.35,
                pointerEvents: t.unlocked ? 'auto' : 'none',
                textDecoration: 'none',
              }}
            >
              {/* left accent */}
              <div
                className="self-stretch rounded-full shrink-0"
                style={{
                  width: 2,
                  background: isMastered ? 'var(--green)' : t.exercisesDone > 0 ? 'var(--amber)' : 'var(--line)',
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                  {TOPIC_LABELS[t.topic] ?? t.topic}
                </p>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--s3)', width: 140 }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${t.exercisesDone > 0 ? Math.round(rankPct * 100) : 0}%`,
                      background: isMastered ? 'var(--green)' : 'var(--amber)',
                    }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                {t.exercisesDone > 0 ? (
                  <>
                    <p className="text-base">{rank.emoji}</p>
                    <p className="text-xs" style={{ color: 'var(--text3)' }}>
                      {t.xp} XP{nextXp ? ` · ${nextXp - t.xp} to next` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text3)' }}>
                    {t.unlocked ? 'Not started' : 'Locked'}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
