'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TagPicker } from '@/components/words/tag-picker';
import { useDecks, useCreateDeck } from '@/hooks/use-decks';

const fieldStyle = { background: 'var(--s3)', border: '1px solid var(--line)', color: 'var(--text)' };

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{children}</div>;
}

interface DeckTagPickerProps {
  deckId: string;
  onDeckId: (id: string) => void;
  tagIds: string[];
  onTagIds: (ids: string[]) => void;
}

export function DeckTagPicker({ deckId, onDeckId, tagIds, onTagIds }: DeckTagPickerProps) {
  const { data: decks } = useDecks();
  const createDeck = useCreateDeck();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const owned = decks?.filter((d) => !d.isCurated) ?? [];

  // Default to the first owned deck once decks load.
  useEffect(() => {
    if (!deckId && owned.length > 0) onDeckId(owned[0].id);
  }, [owned, deckId, onDeckId]);

  const create = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const deck = await createDeck.mutateAsync({ title });
    onDeckId(deck.id);
    setNewTitle('');
    setCreating(false);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label>Target deck</Label>
        {creating ? (
          <div className="flex gap-1.5">
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="New deck name" autoFocus
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void create(); } }} />
            <Button size="sm" variant="primary" loading={createDeck.isPending} onClick={create} type="button">Create</Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)} type="button">Cancel</Button>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <select value={deckId} onChange={(e) => onDeckId(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
              {owned.length === 0 && <option value="">No decks yet</option>}
              {owned.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
            <Button size="sm" variant="secondary" onClick={() => setCreating(true)} type="button">New</Button>
          </div>
        )}
      </div>
      <div>
        <Label>Tags for this batch</Label>
        <TagPicker selected={tagIds} onChange={onTagIds} />
      </div>
    </div>
  );
}
