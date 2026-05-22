'use client';

import { useState, useCallback } from 'react';
import type { VocabWord } from '@germanup/types';
import { useFlashcardResult } from '@/hooks/use-vocab';
import { cn } from '@/lib/utils';

const GENDER_COLOR: Record<string, string> = {
  der: '#60A5FA',
  die: '#F472B6',
  das: '#A78BFA',
};

const GENDER_BG: Record<string, string> = {
  der: 'rgba(96,165,250,0.12)',
  die: 'rgba(244,114,182,0.12)',
  das: 'rgba(167,139,250,0.12)',
};

interface FlashcardSessionProps {
  words: VocabWord[];
  onFinish: (score: { knew: number; total: number }) => void;
}

export function FlashcardSession({ words, onFinish }: FlashcardSessionProps) {
  const [queue, setQueue]   = useState<VocabWord[]>([...words]);
  const [index, setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knew, setKnew]     = useState(0);
  const [total, setTotal]   = useState(0);
  const { mutate: recordResult } = useFlashcardResult();

  const current  = queue[index];
  const progress = Math.round((index / queue.length) * 100);

  const handleFlip = useCallback(() => setFlipped(true), []);

  const handleResult = useCallback(
    (didKnow: boolean) => {
      if (!current) return;

      recordResult({ wordId: current.id, knew: didKnow });
      setTotal((t) => t + 1);
      if (didKnow) setKnew((k) => k + 1);

      if (!didKnow) {
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

  const gColor = current.gender ? GENDER_COLOR[current.gender] : undefined;
  const gBg    = current.gender ? GENDER_BG[current.gender]    : undefined;

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto">

      {/* Progress */}
      <div className="w-full">
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text3)' }}>
          <span>{index + 1} / {queue.length}</span>
          <span style={{ color: 'var(--green)' }}>{knew} known</span>
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: 'var(--line)' }}>
          <div
            className="h-1 rounded-full transition-all"
            style={{ width: `${progress}%`, background: 'var(--green)' }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className={cn(
          'w-full min-h-52 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all',
          flipped ? '' : 'hover:opacity-90',
        )}
        style={{
          background: 'var(--s2)',
          border: flipped
            ? `1px solid ${gColor ?? 'var(--line2)'}`
            : '1px solid var(--line)',
        }}
        onClick={!flipped ? handleFlip : undefined}
      >
        {!flipped ? (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text3)' }}>
              What is this in German?
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {current.english}
            </p>
            <p className="text-xs mt-5" style={{ color: 'var(--text3)' }}>
              click to reveal
            </p>
          </>
        ) : (
          <>
            {current.gender && (
              <span
                className="text-sm font-bold px-3 py-1 rounded-lg mb-4"
                style={{ background: gBg, color: gColor }}
              >
                {current.gender}
              </span>
            )}
            <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
              {current.german}
            </p>
            {current.plural && (
              <p className="text-sm mt-1" style={{ color: 'var(--text3)' }}>
                pl. {current.plural}
              </p>
            )}
            {current.example && (
              <p className="text-sm mt-3 italic" style={{ color: 'var(--text2)' }}>
                &ldquo;{current.example}&rdquo;
              </p>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      {flipped ? (
        <div className="flex gap-3 w-full">
          <button
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-85"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#FCA5A5',
            }}
            onClick={() => handleResult(false)}
          >
            ✕ &nbsp;Didn&apos;t know
          </button>
          <button
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-85"
            style={{
              background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.25)',
              color: 'var(--green)',
            }}
            onClick={() => handleResult(true)}
          >
            ✓ &nbsp;Knew it
          </button>
        </div>
      ) : (
        <button
          className="w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-85"
          style={{ background: 'var(--green)', color: 'var(--bg)' }}
          onClick={handleFlip}
        >
          Reveal →
        </button>
      )}
    </div>
  );
}
