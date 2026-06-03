'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useDecks, useStartDeck } from '@/hooks/use-decks';
import { useWords, useDeleteWord } from '@/hooks/use-words';
import { useTags } from '@/hooks/use-tags';
import { DeckCard } from '@/components/words/deck-card';
import { WordTable } from '@/components/words/word-table';
import { WordFilters, type WordFilterValue } from '@/components/words/word-filters';
import { WordFormModal } from '@/components/words/word-form-modal';
import { CreateDeckModal } from '@/components/words/create-deck-modal';
import { GenerateDeckModal } from '@/components/words/generate-deck-modal';
import { StatsPanel } from '@/components/words/stats-panel';
import { useSubscriptionStatus } from '@/hooks/use-subscription';
import { PlusIcon, SparklesIcon } from '@/components/words/icons';
import type { DeckSummary, Word, PartOfSpeech } from '@/types/words';

const LIMIT = 20;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>{children}</h2>;
}

export default function WordsPage() {
  const router = useRouter();
  const { data: decks, isLoading: decksLoading } = useDecks();
  const { data: tags } = useTags();
  const { data: subscription } = useSubscriptionStatus();
  const isPro = subscription?.plan === 'PRO';
  const startDeck = useStartDeck();
  const deleteWord = useDeleteWord();

  const [filters, setFilters] = useState<WordFilterValue>({ search: '', deck: '', tag: '', partOfSpeech: '' });
  const [page, setPage] = useState(1);
  const [showAddWord, setShowAddWord] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [editing, setEditing] = useState<Word | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);

  const onGenerateClick = () => (isPro ? setShowGenerate(true) : router.push('/pricing'));

  const wordParams = useMemo(() => ({
    search: filters.search || undefined,
    deck: filters.deck || undefined,
    tag: filters.tag || undefined,
    partOfSpeech: (filters.partOfSpeech || undefined) as PartOfSpeech | undefined,
    page,
    limit: LIMIT,
  }), [filters, page]);
  const { data: words, isLoading: wordsLoading } = useWords(wordParams);

  const curated = decks?.filter((d) => d.isCurated) ?? [];
  const mine = decks?.filter((d) => !d.isCurated) ?? [];

  const onStart = async (deck: DeckSummary) => {
    setStartingId(deck.id);
    try {
      await startDeck.mutateAsync(deck.id);
      router.push(`/words/${deck.id}`);
    } finally {
      setStartingId(null);
    }
  };
  const onOpen = (deck: DeckSummary) => router.push(`/words/${deck.id}`);

  const setFiltersReset = (v: WordFilterValue) => { setFilters(v); setPage(1); };
  const totalPages = words ? Math.max(1, Math.ceil(words.total / LIMIT)) : 1;

  return (
    <div className="mx-auto w-full px-6 py-8" style={{ maxWidth: 920 }}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Words</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>Browse decks, build your own, and grow your vocabulary.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => router.push('/words/study')}>Study due</Button>
          <Button variant="secondary" onClick={() => router.push('/words/import')}>Import</Button>
          <Button variant="secondary" onClick={onGenerateClick}><SparklesIcon width={14} height={14} /> Generate with AI</Button>
          <Button variant="secondary" onClick={() => setShowNewDeck(true)}><PlusIcon width={14} height={14} /> New deck</Button>
          <Button variant="primary" onClick={() => setShowAddWord(true)} disabled={mine.length === 0}><PlusIcon width={14} height={14} /> Add word</Button>
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <SectionLabel>Overview</SectionLabel>
          <button onClick={() => router.push('/words/stats')} className="text-xs font-medium transition-opacity hover:opacity-80" style={{ color: 'var(--text2)' }}>
            Advanced stats
          </button>
        </div>
        <StatsPanel />
      </div>

      {decksLoading ? (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
      ) : (
        <>
          {curated.length > 0 && (
            <section className="mb-8">
              <SectionLabel>Curated decks</SectionLabel>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                {curated.map((d) => (
                  <DeckCard key={d.id} deck={d} onStart={onStart} onOpen={onOpen} starting={startingId === d.id} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-8">
            <SectionLabel>My decks</SectionLabel>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {mine.map((d) => <DeckCard key={d.id} deck={d} onOpen={onOpen} />)}
              <button
                onClick={() => setShowNewDeck(true)}
                className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl text-sm transition-colors hover:opacity-80"
                style={{ background: 'var(--s1)', border: '1px dashed var(--line2)', color: 'var(--text3)' }}
              >
                <PlusIcon /> New deck
              </button>
            </div>
          </section>
        </>
      )}

      <section>
        <SectionLabel>All words</SectionLabel>
        <div className="mb-3">
          <WordFilters value={filters} onChange={setFiltersReset} decks={decks ?? []} tags={tags ?? []} />
        </div>
        {wordsLoading ? (
          <div className="flex justify-center py-12"><Spinner className="h-6 w-6" /></div>
        ) : (
          <>
            <WordTable
              words={words?.data ?? []}
              onEdit={(w) => setEditing(w)}
              onDelete={(w) => { if (confirm(`Delete "${w.german}"?`)) void deleteWord.mutate(w.id); }}
              emptyText="No words match these filters."
            />
            {words && words.total > LIMIT && (
              <div className="mt-4 flex items-center justify-center gap-3 text-sm" style={{ color: 'var(--text2)' }}>
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <span>Page {page} of {totalPages}</span>
                <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </section>

      <WordFormModal open={showAddWord} onClose={() => setShowAddWord(false)} ownedDecks={mine} />
      {editing && (
        <WordFormModal open onClose={() => setEditing(null)} ownedDecks={mine} editing={editing} />
      )}
      <CreateDeckModal open={showNewDeck} onClose={() => setShowNewDeck(false)} />
      <GenerateDeckModal open={showGenerate} onClose={() => setShowGenerate(false)} />
    </div>
  );
}
