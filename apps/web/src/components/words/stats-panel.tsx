'use client';

import { useWordsStats } from '@/hooks/use-review';

function Cell({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
      <div className="text-xl font-black leading-none" style={{ color: color ?? 'var(--text)' }}>{value}</div>
      <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</div>
    </div>
  );
}

export function StatsPanel() {
  const { data: stats } = useWordsStats();
  if (!stats) return null;

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
      <Cell label="Total" value={stats.totalWords} />
      <Cell label="New" value={stats.byState.new} color="var(--text2)" />
      <Cell label="Learning" value={stats.byState.learning} color="var(--amber)" />
      <Cell label="Review" value={stats.byState.review} color="var(--green)" />
      <Cell label="Lapsed" value={stats.byState.lapsed} color="#EF4444" />
      <Cell label="Due now" value={stats.dueNow} color="var(--accent)" />
    </div>
  );
}
