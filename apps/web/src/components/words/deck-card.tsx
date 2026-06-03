'use client';

import { Button } from '@/components/ui/button';
import type { DeckSummary } from '@/types/words';

interface DeckCardProps {
  deck: DeckSummary;
  onStart?: (deck: DeckSummary) => void;
  onOpen: (deck: DeckSummary) => void;
  starting?: boolean;
}

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text2)' }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {value} {label}
    </span>
  );
}

export function DeckCard({ deck, onStart, onOpen, starting }: DeckCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-xl p-4"
      style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
    >
      <div className="flex-1">
        <div className="font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          {deck.title}
        </div>
        <div className="mt-0.5 text-xs" style={{ color: 'var(--text3)' }}>
          {[deck.level, deck.topic].filter(Boolean).join(' · ')}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-xs" style={{ color: 'var(--text2)' }}>{deck.wordCount} words</span>
        {deck.dueCount > 0 && <Pill label="due" value={deck.dueCount} color="var(--accent)" />}
        {deck.newCount > 0 && <Pill label="new" value={deck.newCount} color="var(--text3)" />}
      </div>

      <div className="flex gap-2">
        {deck.isCurated && onStart ? (
          <Button size="sm" variant="primary" loading={starting} onClick={() => onStart(deck)}>
            Start learning
          </Button>
        ) : null}
        <Button size="sm" variant="secondary" onClick={() => onOpen(deck)}>
          Open
        </Button>
      </div>
    </div>
  );
}
