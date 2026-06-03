'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeftIcon } from '@/components/words/icons';
import { useReviewQueue, useGradeCard } from '@/hooks/use-review';
import { useSpeak } from '@/hooks/use-speak';
import { ModePicker, type StudyDirection } from '@/components/words/study/mode-picker';
import { FlashcardMode, type FlashDirection } from '@/components/words/study/flashcard-mode';
import { TypingMode } from '@/components/words/study/type-mode';
import { ListeningMode } from '@/components/words/study/listening-mode';
import { SessionSummary } from '@/components/words/study/session-summary';
import type { ReviewGrade, ReviewItem, ReviewMode } from '@/types/words';

type Phase = 'pick' | 'run' | 'done';

function StudyRunner() {
  const router = useRouter();
  const params = useSearchParams();
  const deck = params.get('deck') ?? undefined;

  const { data: queue, isLoading } = useReviewQueue(deck);
  const grade = useGradeCard();
  const { speak, supported } = useSpeak();

  const [phase, setPhase] = useState<Phase>('pick');
  const [mode, setMode] = useState<ReviewMode>('flashcard');
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [directions, setDirections] = useState<FlashDirection[]>([]);
  const [index, setIndex] = useState(0);
  const [counts, setCounts] = useState({ again: 0, good: 0, easy: 0 });

  const backToWords = () => router.push('/words');
  const backToDeck = deck ? () => router.push(`/words/${deck}`) : undefined;

  const start = (m: ReviewMode, dir: StudyDirection) => {
    const queued = queue?.items ?? [];
    setMode(m);
    setItems(queued);
    setDirections(queued.map(() => (dir === 'mixed' ? (Math.random() < 0.5 ? 'de-en' : 'en-de') : dir)));
    setIndex(0);
    setCounts({ again: 0, good: 0, easy: 0 });
    setPhase('run');
  };

  const onGrade = (g: ReviewGrade) => {
    const item = items[index];
    if (item) grade.mutate({ wordId: item.wordId, grade: g, mode });
    setCounts((c) => ({ ...c, [g.toLowerCase() as 'again' | 'good' | 'easy']: c[g.toLowerCase() as 'again' | 'good' | 'easy'] + 1 }));
    if (index + 1 >= items.length) setPhase('done');
    else setIndex((i) => i + 1);
  };

  const restart = () => setPhase('pick');

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-7 w-7" /></div>;

  const total = queue?.count ?? 0;

  return (
    <div className="mx-auto w-full px-6 py-8" style={{ maxWidth: 640 }}>
      <button onClick={backToWords} className="mb-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--text2)' }}>
        <ArrowLeftIcon width={14} height={14} /> Back to words
      </button>

      {phase === 'pick' && (
        total === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Nothing due right now</h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>Enroll in a deck or come back when cards are due.</p>
            <div className="mt-4 flex justify-center gap-2">
              {backToDeck && <Button variant="secondary" onClick={backToDeck}>Back to deck</Button>}
              <Button variant="primary" onClick={backToWords}>Browse decks</Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mb-4 text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Study</h1>
            <ModePicker dueCount={queue?.dueCount ?? 0} newCount={queue?.newCount ?? 0} onStart={start} />
          </>
        )
      )}

      {phase === 'run' && items[index] && (
        <>
          <div className="mb-4 flex items-center justify-between text-sm" style={{ color: 'var(--text3)' }}>
            <span>{index + 1} of {items.length}</span>
            <div className="h-1 flex-1 mx-3 overflow-hidden rounded-full" style={{ background: 'var(--s2)' }}>
              <div className="h-full rounded-full" style={{ width: `${((index) / items.length) * 100}%`, background: 'var(--accent)', transition: 'width 0.2s' }} />
            </div>
          </div>
          {mode === 'flashcard' && (
            <FlashcardMode key={index} item={items[index]} direction={directions[index] ?? 'de-en'} onGrade={onGrade} speak={speak} supported={supported} />
          )}
          {mode === 'type' && <TypingMode key={index} item={items[index]} onGrade={onGrade} speak={speak} supported={supported} />}
          {mode === 'listening' && <ListeningMode key={index} item={items[index]} onGrade={onGrade} speak={speak} supported={supported} />}
        </>
      )}

      {phase === 'done' && (
        <SessionSummary
          counts={counts}
          total={items.length}
          deckId={deck}
          onRestart={restart}
          onBackToWords={backToWords}
          onBackToDeck={backToDeck}
        />
      )}
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Spinner className="h-7 w-7" /></div>}>
      <StudyRunner />
    </Suspense>
  );
}
