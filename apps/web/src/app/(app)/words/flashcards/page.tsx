'use client';

import { useState } from 'react';
import { useFlashcardSession } from '@/hooks/use-vocab';
import { FlashcardSession } from '@/components/vocabulary/flashcard-session';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';

type Step = 'config' | 'session' | 'summary';

const SIZES = [10, 20, 50] as const;
const LEVELS = ['All', 'A1', 'A2', 'A3'] as const;

export default function FlashcardsPage() {
  const [step, setStep] = useState<Step>('config');
  const [size, setSize] = useState<number>(20);
  const [level, setLevel] = useState<string>('All');
  const [summary, setSummary] = useState<{ knew: number; total: number } | null>(null);

  const { data: words, isLoading, isError, error, refetch } = useFlashcardSession({
    size,
    level: level === 'All' ? undefined : level,
  });

  const handleStart = async () => {
    await refetch();
    setStep('session');
  };

  const handleFinish = (score: { knew: number; total: number }) => {
    setSummary(score);
    setStep('summary');
  };

  if (step === 'config') {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <Link
            href="/words"
            className="text-sm flex items-center gap-1.5 mb-5 w-fit transition-opacity hover:opacity-70"
            style={{ color: 'var(--text2)' }}
          >
            ← Words
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Flashcard session</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            Review your saved nouns with spaced repetition.
          </p>
        </div>

        <div className="rounded-xl border p-6 space-y-6" style={{ background: 'var(--s1)', borderColor: 'var(--line)' }}>
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>Session size</p>
            <div className="flex gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={
                    size === s
                      ? { background: 'var(--accent)', color: '#111' }
                      : { background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }
                  }
                >
                  {s} cards
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--text2)' }}>Level</p>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={
                    level === l
                      ? { background: 'var(--accent)', color: '#111' }
                      : { background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }
                  }
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={isLoading}
            className="w-full py-3 rounded-lg font-medium transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: 'var(--accent)', color: '#111' }}
          >
            {isLoading ? 'Loading…' : 'Start session'}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'session') {
    if (isLoading) {
      return (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="max-w-md mx-auto py-12 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="font-medium mb-2" style={{ color: 'var(--text)' }}>
            {(error as Error)?.message ?? 'Failed to load flashcards'}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => setStep('config')}
              className="px-5 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
            >
              Back
            </button>
            <button
              onClick={() => void refetch()}
              className="px-5 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: '#111' }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!words?.length) {
      return (
        <div className="text-center py-20 max-w-md mx-auto">
          <p className="text-4xl mb-4">📭</p>
          <p className="mb-6" style={{ color: 'var(--text2)' }}>No words found for this filter.</p>
          <button
            onClick={() => setStep('config')}
            className="px-5 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
          >
            Back to config
          </button>
        </div>
      );
    }

    return (
      <div className="py-4">
        <button
          onClick={() => setStep('config')}
          className="text-sm mb-6 flex items-center gap-1.5 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text2)' }}
        >
          ← Exit session
        </button>
        <FlashcardSession words={words} onFinish={handleFinish} />
      </div>
    );
  }

  const pct = summary ? Math.round((summary.knew / summary.total) * 100) : 0;
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="text-6xl mb-6">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>Session complete!</h2>
      <p className="mb-8" style={{ color: 'var(--text2)' }}>
        You knew <strong style={{ color: 'var(--text)' }}>{summary?.knew}</strong> out of{' '}
        <strong style={{ color: 'var(--text)' }}>{summary?.total}</strong> cards ({pct}%)
      </p>

      <div className="w-full rounded-full h-2 mb-8" style={{ background: 'var(--s3)' }}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: pct >= 50 ? 'var(--accent)' : 'var(--amber)' }}
        />
      </div>

      <div className="flex gap-3 justify-center">
        <button
          onClick={() => { setSummary(null); setStep('config'); }}
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
        >
          New session
        </button>
        <Link
          href="/words"
          className="px-5 py-2.5 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: '#111' }}
        >
          Back to words
        </Link>
      </div>
    </div>
  );
}
