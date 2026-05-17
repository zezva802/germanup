'use client';

import { useState, useCallback } from 'react';
import type { VocabWord } from '@germanup/types';
import { useFlashcardResult } from '@/hooks/use-vocab';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FlashcardSessionProps {
  words: VocabWord[];
  onFinish: (score: { knew: number; total: number }) => void;
}

export function FlashcardSession({ words, onFinish }: FlashcardSessionProps) {
  const [queue, setQueue] = useState<VocabWord[]>([...words]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew] = useState(0);
  const [total, setTotal] = useState(0);
  const { mutate: recordResult } = useFlashcardResult();

  const current = queue[index];
  const progress = Math.round((index / queue.length) * 100);

  const handleFlip = useCallback(() => setFlipped(true), []);

  const handleResult = useCallback(
    (didKnow: boolean) => {
      if (!current) return;

      recordResult({ wordId: current.id, knew: didKnow });
      setTotal((t) => t + 1);
      if (didKnow) setKnew((k) => k + 1);

      if (!didKnow) {
        // Requeue: add back two positions later so it gets shown again
        const newQueue = [...queue];
        const reinsertAt = Math.min(index + 3, newQueue.length);
        newQueue.splice(reinsertAt, 0, { ...current });
        setQueue(newQueue);
      }

      setFlipped(false);

      if (index + 1 >= queue.length) {
        onFinish({ knew: knew + (didKnow ? 1 : 0), total: total + 1 });
      } else {
        setIndex((i) => i + 1);
      }
    },
    [current, queue, index, knew, total, recordResult, onFinish],
  );

  if (!current) return null;

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{index + 1} / {queue.length}</span>
          <span>{knew} known</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-brand-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className={cn(
          'w-full min-h-48 bg-white border-2 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm cursor-pointer transition-all',
          flipped ? 'border-brand-300' : 'border-gray-200 hover:border-brand-200',
        )}
        onClick={!flipped ? handleFlip : undefined}
      >
        {!flipped ? (
          <>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">English</p>
            <p className="text-2xl font-semibold text-gray-900">{current.english}</p>
            <p className="text-xs text-gray-400 mt-4">Tap to reveal</p>
          </>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wider">German</p>
            <p className="text-3xl font-bold text-gray-900">
              {current.gender && (
                <span className={current.gender === 'der' ? 'text-blue-500' : current.gender === 'die' ? 'text-pink-500' : 'text-green-500'}>
                  {current.gender}{' '}
                </span>
              )}
              {current.german}
            </p>
            {current.plural && (
              <p className="text-gray-400 text-sm mt-1">pl. {current.plural}</p>
            )}
            {current.example && (
              <p className="text-gray-500 text-sm mt-3 italic">&ldquo;{current.example}&rdquo;</p>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      {flipped ? (
        <div className="flex gap-4 w-full">
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleResult(false)}
          >
            ❌ Didn&apos;t know
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => handleResult(true)}
          >
            ✅ Knew it
          </Button>
        </div>
      ) : (
        <Button size="lg" className="w-full" onClick={handleFlip}>
          Reveal →
        </Button>
      )}
    </div>
  );
}
