'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConjugationTableView } from '@/components/words/conjugation-table';
import { AudioButton } from './audio-button';
import { GradeButtons } from './grade-buttons';
import type { ReviewItem, ReviewGrade } from '@/types/words';

export type FlashDirection = 'de-en' | 'en-de';

interface FlashcardModeProps {
  item: ReviewItem;
  direction: FlashDirection;
  onGrade: (grade: ReviewGrade) => void;
  speak: (text: string, opts?: { audioUrl?: string }) => void;
  supported: boolean;
}

export function FlashcardMode({ item, direction, onGrade, speak, supported }: FlashcardModeProps) {
  const { word } = item;
  const [flipped, setFlipped] = useState(false);
  const germanText = word.gender ? `${word.gender} ${word.german}` : word.german;
  const front = direction === 'de-en' ? germanText : word.english;
  const back = direction === 'de-en' ? word.english : germanText;

  // Keyboard: Space flips; 1/2/3 grade once flipped. Resets per card via key remount.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' && !flipped) { e.preventDefault(); setFlipped(true); }
      else if (flipped && ['1', '2', '3'].includes(e.key)) {
        onGrade(e.key === '1' ? 'AGAIN' : e.key === '2' ? 'GOOD' : 'EASY');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flipped, onGrade]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl px-6 py-10 text-center" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
        <div className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{front}</div>
        {flipped && (
          <div className="mt-5 space-y-3 border-t pt-5" style={{ borderColor: 'var(--line)' }}>
            <div className="text-2xl" style={{ color: 'var(--text)' }}>{back}</div>
            {word.plural && <div className="text-sm" style={{ color: 'var(--text3)' }}>plural: {word.plural}</div>}
            {word.example && <p className="text-sm italic" style={{ color: 'var(--text2)' }}>{word.example}</p>}
            {word.partOfSpeech === 'VERB' && word.conjugation && (
              <div className="mx-auto max-w-md pt-2 text-left"><ConjugationTableView conjugation={word.conjugation} /></div>
            )}
          </div>
        )}
        <div className="mt-5 flex justify-center">
          <AudioButton text={word.german} speak={speak} supported={supported} audioUrl={word.audioUrl} />
        </div>
      </div>

      {flipped ? (
        <GradeButtons onGrade={onGrade} />
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => setFlipped(true)}>Show answer (Space)</Button>
      )}
    </div>
  );
}
