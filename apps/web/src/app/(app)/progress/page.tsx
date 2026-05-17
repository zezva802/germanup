'use client';

import Link from 'next/link';
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

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function StreakCalendar({ days }: { days: string[] }) {
  const daySet = new Set(days);

  // Build last 35 days grid (5 weeks)
  const cells: { date: string; active: boolean }[] = [];
  const today = new Date();
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ date: iso, active: daySet.has(iso) });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Activity (last 5 weeks)</h3>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                title={cell.date}
                className={cn(
                  'w-4 h-4 rounded-sm',
                  cell.active ? 'bg-brand-500' : 'bg-gray-100',
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Each square = one day · Purple = practiced
      </p>
    </div>
  );
}

function TopicProgressRow({
  topic,
  done,
  correct,
  pct,
  unlocked,
}: {
  topic: string;
  done: number;
  correct: number;
  pct: number;
  unlocked: boolean;
}) {
  const isWeak = unlocked && done >= 5 && pct < 50;

  return (
    <Link
      href={unlocked ? `/grammar/a1/${topic}` : '#'}
      className={cn(
        'flex items-center gap-4 p-4 bg-white border rounded-xl transition-all',
        unlocked ? 'border-gray-200 hover:shadow-sm hover:border-brand-300' : 'border-gray-100 opacity-50',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {TOPIC_LABELS[topic] ?? topic}
          </p>
          {isWeak && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
              Needs work
            </span>
          )}
          {!unlocked && <span className="text-xs text-gray-400">🔒</span>}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={cn(
              'h-1.5 rounded-full transition-all',
              pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-brand-500' : 'bg-yellow-400',
            )}
            style={{ width: `${done > 0 ? pct : 0}%` }}
          />
        </div>
      </div>

      <div className="text-right shrink-0">
        {done > 0 ? (
          <>
            <p className={cn('text-sm font-bold', pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-brand-600' : 'text-yellow-600')}>
              {pct}%
            </p>
            <p className="text-xs text-gray-400">
              {correct}/{done}
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-400">{unlocked ? 'Not started' : 'Locked'}</p>
        )}
      </div>
    </Link>
  );
}

export default function ProgressPage() {
  const { data, isLoading } = useProgress();

  if (isLoading) {
    return (
      <div className="max-w-4xl animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const topics = data?.topics ?? [];
  const weakTopics = topics.filter((t) => t.unlocked && t.exercisesDone >= 5 && t.percentCorrect < 50);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Progress</h1>
        <p className="text-gray-500 mt-1">Your A1 German learning journey</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Streak"
          value={`${data?.streak ?? 0} days`}
          sub={data?.streak ? 'Keep it up!' : 'Practice today'}
        />
        <StatCard
          label="Total Exercises"
          value={data?.totalExercisesDone ?? 0}
          sub="completed"
        />
        <StatCard
          label="Overall Score"
          value={`${data?.overallPercent ?? 0}%`}
          sub="correct answers"
        />
        <StatCard
          label="Topics Active"
          value={topics.filter((t) => t.exercisesDone > 0).length}
          sub={`of ${topics.length} topics`}
        />
      </div>

      {/* Streak calendar */}
      <div className="mb-8">
        <StreakCalendar days={data?.calendarDays ?? []} />
      </div>

      {/* Weakest topics callout */}
      {weakTopics.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
          <p className="font-semibold text-orange-800 mb-1">
            Focus areas — below 50% correct:
          </p>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <Link
                key={t.topic}
                href={`/grammar/a1/${t.topic}`}
                className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-lg hover:bg-orange-200"
              >
                {TOPIC_LABELS[t.topic] ?? t.topic} ({t.percentCorrect}%)
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All topics */}
      <h2 className="font-semibold text-gray-900 mb-3">A1 Topics</h2>
      <div className="space-y-2">
        {topics.map((t) => (
          <TopicProgressRow
            key={t.topic}
            topic={t.topic}
            done={t.exercisesDone}
            correct={t.correctCount}
            pct={t.percentCorrect}
            unlocked={t.unlocked}
          />
        ))}
      </div>
    </div>
  );
}
