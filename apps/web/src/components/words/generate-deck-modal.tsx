'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog } from './dialog';
import { SparklesIcon } from './icons';
import { useGenerateDeck } from '@/hooks/use-decks';

const fieldStyle = { background: 'var(--s3)', border: '1px solid var(--line)', color: 'var(--text)' };
const LEVELS = ['A1', 'A2', 'A3'];
const COUNTS = [10, 15, 20, 25, 30];

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{children}</div>;
}

export function GenerateDeckModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const generate = useGenerateDeck();
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('A1');
  const [count, setCount] = useState(20);
  const [error, setError] = useState('');

  const close = () => {
    if (generate.isPending) return;
    setTopic('');
    setError('');
    onClose();
  };

  const submit = async () => {
    setError('');
    if (!topic.trim()) { setError('Topic is required.'); return; }
    try {
      const deck = await generate.mutateAsync({ topic: topic.trim(), level, count });
      setTopic('');
      onClose();
      router.push(`/words/${deck.id}`);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={close} title="Generate a deck with AI">
      <div className="space-y-3">
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          Claude builds a themed deck of enriched words. It is saved to your decks for review.
        </p>
        <div>
          <Label>Topic</Label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. kitchen vocabulary"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={fieldStyle}
            autoFocus
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Level</Label>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label>Words</Label>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
              {COUNTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--text3)' }}>Pro · counts against your daily deck-generation limit.</p>
        {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={close} type="button" disabled={generate.isPending}>Cancel</Button>
          <Button variant="primary" loading={generate.isPending} onClick={submit} type="button">
            <SparklesIcon width={14} height={14} /> Generate
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
