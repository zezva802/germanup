'use client';

import { useState } from 'react';
import { useFlashcardSession } from '@/hooks/use-vocab';
import { FlashcardSession } from '@/components/vocabulary/flashcard-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
        <div className="mb-6">
          <Link href="/vocabulary" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to vocabulary
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Flashcard session</h1>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Session size</p>
              <div className="flex gap-3">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      size === s
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s} cards
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Level</p>
              <div className="flex gap-3">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      level === l
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={handleStart} loading={isLoading}>
              Start session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'session') {
    if (isLoading) {
      return (
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8 text-brand-500" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="max-w-md mx-auto py-12 text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <p className="text-red-600 font-medium mb-2">
            {(error as Error)?.message ?? 'Failed to load flashcards'}
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button variant="secondary" onClick={() => setStep('config')}>Back</Button>
            <Button onClick={() => void refetch()}>Retry</Button>
          </div>
        </div>
      );
    }

    if (!words?.length) {
      return (
        <div className="text-center py-20 max-w-md mx-auto">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-600 mb-6">No words found for this filter.</p>
          <Button onClick={() => setStep('config')} variant="secondary">
            Back to config
          </Button>
        </div>
      );
    }

    return (
      <div className="py-4">
        <div className="mb-6">
          <button
            onClick={() => setStep('config')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Exit session
          </button>
        </div>
        <FlashcardSession words={words} onFinish={handleFinish} />
      </div>
    );
  }

  // Summary
  const pct = summary ? Math.round((summary.knew / summary.total) * 100) : 0;
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="text-6xl mb-6">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Session complete!</h2>
      <p className="text-gray-600 mb-6">
        You knew <strong>{summary?.knew}</strong> out of <strong>{summary?.total}</strong> cards ({pct}%)
      </p>

      <div className="w-full bg-gray-200 rounded-full h-3 mb-8">
        <div
          className={`h-3 rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-4 justify-center">
        <Button variant="secondary" onClick={() => { setSummary(null); setStep('config'); }}>
          New session
        </Button>
        <Link href="/vocabulary">
          <Button>Back to vocabulary</Button>
        </Link>
      </div>
    </div>
  );
}
