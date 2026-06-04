'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
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
  const qc = useQueryClient();

  // Refresh decks / stats / streak ONCE when leaving study, instead of after every grade.
  const studiedRef = useRef(false);
  useEffect(() => {
    return () => {
      if (!studiedRef.current) return;
      void qc.invalidateQueries({ queryKey: ['decks'] });
      void qc.invalidateQueries({ queryKey: ['words-stats'] });
      void qc.invalidateQueries({ queryKey: ['words-stats-advanced'] });
      void qc.invalidateQueries({ queryKey: ['progress'] });
    };
  }, [qc]);

  type Entry = { item: ReviewItem; dir: FlashDirection };

  const [phase, setPhase] = useState<Phase>('pick');
  const [mode, setMode] = useState<ReviewMode>('flashcard');
  const [current, setCurrent] = useState<Entry | null>(null);
  const [step, setStep] = useState(0); // remount key for the mode + advances each card shown
  const [graded, setGraded] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [counts, setCounts] = useState({ again: 0, good: 0, easy: 0 });

  // Live session queue (the cards after `current`). LEARNING/LAPSED cards get pushed back
  // here on grade so they loop within the session; held in a ref to avoid stale-closure races.
  const restRef = useRef<Entry[]>([]);
  const gradingRef = useRef(false);

  const backToWords = () => router.push('/words');
  const backToDeck = deck ? () => router.push(`/words/${deck}`) : undefined;

  const start = (m: ReviewMode, dir: StudyDirection) => {
    const entries: Entry[] = (queue?.items ?? []).map((it) => ({
      item: it,
      dir: dir === 'mixed' ? (Math.random() < 0.5 ? 'de-en' : 'en-de') : dir,
    }));
    restRef.current = entries.slice(1);
    gradingRef.current = false;
    setMode(m);
    setCurrent(entries[0] ?? null);
    setStep(0);
    setGraded(0);
    setRemaining(entries.length);
    setCounts({ again: 0, good: 0, easy: 0 });
    setPhase(entries.length ? 'run' : 'done');
  };

  const onGrade = async (g: ReviewGrade) => {
    const entry = current;
    if (!entry || gradingRef.current) return;
    gradingRef.current = true;
    studiedRef.current = true;

    setCounts((c) => {
      const k = g.toLowerCase() as 'again' | 'good' | 'easy';
      return { ...c, [k]: c[k] + 1 };
    });
    setGraded((n) => n + 1);

    let nextState: string | undefined;
    try {
      const res = await grade.mutateAsync({ wordId: entry.item.wordId, grade: g, mode });
      nextState = res.state;
    } catch {
      /* keep the session flowing even if the grade POST fails */
    }

    // Still short-term (learning ladder) -> bring it back later this session so you can retry it.
    if (nextState === 'LEARNING' || nextState === 'LAPSED') restRef.current.push(entry);

    const next = restRef.current.shift() ?? null;
    setRemaining(restRef.current.length + (next ? 1 : 0));
    if (next) {
      setCurrent(next);
      setStep((s) => s + 1);
    } else {
      setPhase('done');
    }
    gradingRef.current = false;
  };

  const restart = () => setPhase('pick');

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-7 w-7" /></div>;

  const total = queue?.count ?? 0;
  const progressPct = graded + remaining > 0 ? (graded / (graded + remaining)) * 100 : 0;

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

      {phase === 'run' && current && (
        <>
          <div className="mb-4 flex items-center justify-between text-sm" style={{ color: 'var(--text3)' }}>
            <span>{graded} done · {remaining} left</span>
            <div className="h-1 flex-1 mx-3 overflow-hidden rounded-full" style={{ background: 'var(--s2)' }}>
              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: 'var(--accent)', transition: 'width 0.2s' }} />
            </div>
          </div>
          {mode === 'flashcard' && (
            <FlashcardMode key={step} item={current.item} direction={current.dir} onGrade={onGrade} speak={speak} supported={supported} />
          )}
          {mode === 'type' && <TypingMode key={step} item={current.item} onGrade={onGrade} speak={speak} supported={supported} />}
          {mode === 'listening' && <ListeningMode key={step} item={current.item} onGrade={onGrade} speak={speak} supported={supported} />}
        </>
      )}

      {phase === 'done' && (
        <SessionSummary
          counts={counts}
          total={graded}
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
