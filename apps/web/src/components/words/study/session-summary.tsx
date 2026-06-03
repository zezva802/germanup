'use client';

import { Button } from '@/components/ui/button';

interface SessionSummaryProps {
  counts: { again: number; good: number; easy: number };
  total: number;
  deckId?: string;
  onRestart: () => void;
  onBackToWords: () => void;
  onBackToDeck?: () => void;
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
      <div className="text-2xl font-black" style={{ color }}>{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{label}</div>
    </div>
  );
}

export function SessionSummary({ counts, total, deckId, onRestart, onBackToWords, onBackToDeck }: SessionSummaryProps) {
  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Session complete</h2>
        <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>You reviewed {total} {total === 1 ? 'card' : 'cards'}. Come back when they are due again.</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Again" value={counts.again} color="#EF4444" />
        <Stat label="Good" value={counts.good} color="var(--green)" />
        <Stat label="Easy" value={counts.easy} color="#60A5FA" />
      </div>
      <div className="flex justify-center gap-2">
        <Button variant="primary" onClick={onRestart}>Study again</Button>
        {deckId && onBackToDeck && <Button variant="secondary" onClick={onBackToDeck}>Back to deck</Button>}
        <Button variant="ghost" onClick={onBackToWords}>Back to words</Button>
      </div>
    </div>
  );
}
