'use client';

import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { ProLock } from '@/components/words/pro-lock';
import { ArrowLeftIcon } from '@/components/words/icons';
import { useAdvancedStats } from '@/hooks/use-review';
import { useSubscriptionStatus } from '@/hooks/use-subscription';
import type { AdvancedStats, ForecastBucket, LeechWord } from '@/types/words';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{children}</h2>;
}

function RetentionCard({ stats }: { stats: AdvancedStats }) {
  const { pct, prevPct, reviewsCounted } = stats.retention;
  const delta = pct !== null && prevPct !== null ? Math.round((pct - prevPct) * 10) / 10 : null;
  const deltaColor = delta === null || delta === 0 ? 'var(--text3)' : delta > 0 ? 'var(--green)' : '#EF4444';

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
      <SectionLabel>Retention · last {stats.window.days} days</SectionLabel>
      {pct === null ? (
        <p className="text-sm" style={{ color: 'var(--text3)' }}>Not enough mature reviews yet. Keep studying — this fills in once cards graduate.</p>
      ) : (
        <div className="flex items-end gap-3">
          <span className="text-4xl font-black leading-none" style={{ color: 'var(--text)' }}>{pct}%</span>
          {delta !== null && (
            <span className="mb-1 text-xs font-semibold" style={{ color: deltaColor }}>
              {delta > 0 ? '+' : ''}{delta} pts vs prior {stats.window.days}d
            </span>
          )}
          <span className="mb-1 ml-auto text-xs" style={{ color: 'var(--text3)' }}>{reviewsCounted} reviews counted</span>
        </div>
      )}
    </div>
  );
}

function ForecastChart({ buckets }: { buckets: ForecastBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
      <SectionLabel>Due forecast · next {buckets.length} days</SectionLabel>
      <div className="flex items-end gap-1.5" style={{ height: 120 }}>
        {buckets.map((b, i) => {
          const day = b.date.slice(8); // DD
          const h = Math.round((b.count / max) * 100);
          return (
            <div key={b.date} className="flex flex-1 flex-col items-center gap-1" title={`${b.date}: ${b.count} due`}>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${h}%`,
                    minHeight: b.count > 0 ? 3 : 0,
                    background: i === 0 ? 'var(--accent)' : 'var(--line2)',
                  }}
                />
              </div>
              <span className="text-[9px] tabular-nums" style={{ color: 'var(--text3)' }}>{day}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px]" style={{ color: 'var(--text3)' }}>Bars show cards becoming due each day; today (highlighted) includes anything overdue.</p>
    </div>
  );
}

function LeechList({ stats, onOpen }: { stats: AdvancedStats; onOpen: (l: LeechWord) => void }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
      <SectionLabel>Leeches · {stats.leechThreshold}+ lapses</SectionLabel>
      {stats.leeches.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text3)' }}>No leeches — nothing has lapsed {stats.leechThreshold}+ times. Nice.</p>
      ) : (
        <ul className="divide-y" style={{ borderColor: 'var(--line)' }}>
          {stats.leeches.map((l) => (
            <li key={l.wordId} className="flex items-center justify-between gap-3 py-2">
              <button onClick={() => onOpen(l)} className="text-left transition-opacity hover:opacity-80">
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{l.german}</span>
                <span className="ml-2 text-xs" style={{ color: 'var(--text3)' }}>{l.english}</span>
              </button>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}>
                {l.lapses} lapses
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdvancedStatsPage() {
  const router = useRouter();
  const { data: subscription } = useSubscriptionStatus();
  const isPro = subscription?.plan === 'PRO';
  const { data: stats, isLoading } = useAdvancedStats(!!isPro);

  return (
    <div className="mx-auto w-full px-6 py-8" style={{ maxWidth: 920 }}>
      <button onClick={() => router.push('/words')} className="mb-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--text2)' }}>
        <ArrowLeftIcon width={14} height={14} /> Back to words
      </button>

      <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Advanced stats</h1>
      <p className="mb-6 mt-1 text-sm" style={{ color: 'var(--text2)' }}>Retention, your due forecast, and words that keep tripping you up.</p>

      {!isPro ? (
        <ProLock feature="Advanced stats" hint="See your retention rate, a due-load forecast, and your leech words." />
      ) : isLoading || !stats ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
      ) : (
        <div className="space-y-4">
          <RetentionCard stats={stats} />
          <ForecastChart buckets={stats.forecast} />
          <LeechList stats={stats} onOpen={(l) => router.push(`/words/${l.deckId}`)} />
        </div>
      )}
    </div>
  );
}
