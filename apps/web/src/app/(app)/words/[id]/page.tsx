'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useDeck, useDecks, useDeleteDeck } from '@/hooks/use-decks';
import { useDeleteWord } from '@/hooks/use-words';
import { WordTable } from '@/components/words/word-table';
import { WordFormModal } from '@/components/words/word-form-modal';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@/components/words/icons';
import type { Word } from '@/types/words';

export default function DeckDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: deck, isLoading } = useDeck(id);
  const { data: decks } = useDecks();
  const deleteDeck = useDeleteDeck();
  const deleteWord = useDeleteWord();

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Word | null>(null);

  const summary = decks?.find((d) => d.id === id);
  const owned = deck ? !deck.isCurated : false;

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-7 w-7" /></div>;
  }
  if (!deck) {
    return (
      <div className="mx-auto w-full px-6 py-8" style={{ maxWidth: 820 }}>
        <button onClick={() => router.push('/words')} className="mb-4 inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--text2)' }}>
          <ArrowLeftIcon width={14} height={14} /> Back to words
        </button>
        <p style={{ color: 'var(--text3)' }}>Deck not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full px-6 py-8" style={{ maxWidth: 820 }}>
      <button onClick={() => router.push('/words')} className="mb-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--text2)' }}>
        <ArrowLeftIcon width={14} height={14} /> Back to words
      </button>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{deck.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: 'var(--text2)' }}>
            <span>{[deck.level, deck.topic].filter(Boolean).join(' · ')}</span>
            <span>{deck.words.length} words</span>
            {summary && summary.dueCount > 0 && (
              <span style={{ color: 'var(--accent)' }}>{summary.dueCount} due</span>
            )}
            {deck.isCurated && <span style={{ color: 'var(--text3)' }}>Curated</span>}
          </div>
          {deck.description && <p className="mt-2 text-sm" style={{ color: 'var(--text2)' }}>{deck.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => router.push(`/words/study?deck=${deck.id}`)}>Study</Button>
          {owned && (
            <>
              <Button variant="secondary" onClick={() => setShowAdd(true)}><PlusIcon width={14} height={14} /> Add word</Button>
              <Button variant="secondary" onClick={() => { if (confirm(`Delete deck "${deck.title}" and its words?`)) deleteDeck.mutate(deck.id, { onSuccess: () => router.push('/words') }); }}>
                <TrashIcon width={14} height={14} /> Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <WordTable
        words={deck.words}
        editableWordIds={owned ? new Set(deck.words.map((w) => w.id)) : new Set()}
        onEdit={(w) => setEditing(w)}
        onDelete={(w) => { if (confirm(`Delete "${w.german}"?`)) void deleteWord.mutate(w.id); }}
        emptyText={owned ? 'No words yet. Add your first word.' : 'This deck has no words yet.'}
      />

      {owned && summary && (
        <WordFormModal open={showAdd} onClose={() => setShowAdd(false)} ownedDecks={[summary]} defaultDeckId={deck.id} />
      )}
      {editing && summary && (
        <WordFormModal open onClose={() => setEditing(null)} ownedDecks={[summary]} editing={editing} />
      )}
    </div>
  );
}
