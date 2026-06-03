'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { compareAnswer } from '@/lib/normalize-answer';
import { AudioButton } from './audio-button';
import type { ReviewItem, ReviewGrade } from '@/types/words';

const FAST_MS = 4000;

interface TypingModeProps {
  item: ReviewItem;
  onGrade: (grade: ReviewGrade) => void;
  speak: (text: string, opts?: { audioUrl?: string }) => void;
  supported: boolean;
  /** Listening variant: hide the English prompt and auto-play the German audio. */
  listening?: boolean;
}

export function TypingMode({ item, onGrade, speak, supported, listening }: TypingModeProps) {
  const { word } = item;
  const [value, setValue] = useState('');
  const [verdict, setVerdict] = useState<null | { grade: ReviewGrade; kind: 'correct' | 'close' | 'wrong' }>(null);
  const startRef = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-play audio for listening mode; focus the input each new card.
  useEffect(() => {
    startRef.current = Date.now();
    inputRef.current?.focus();
    if (listening && (supported || word.audioUrl)) speak(word.german, word.audioUrl ? { audioUrl: word.audioUrl } : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.wordId]);

  const submit = () => {
    if (verdict) { onGrade(verdict.grade); return; }
    const kind = compareAnswer(value, word.german);
    const fast = Date.now() - startRef.current < FAST_MS;
    const grade: ReviewGrade = kind === 'wrong' ? 'AGAIN' : kind === 'correct' && fast ? 'EASY' : 'GOOD';
    setVerdict({ grade, kind });
  };

  const reveal = () => setVerdict({ grade: 'AGAIN', kind: 'wrong' });

  const color = verdict ? (verdict.kind === 'wrong' ? '#EF4444' : verdict.kind === 'close' ? 'var(--amber)' : 'var(--green)') : 'var(--line)';

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
          {listening ? 'Listen and type the German' : 'Type the German'}
        </div>
        {listening ? (
          <div className="flex justify-center py-2"><AudioButton text={word.german} speak={speak} supported={supported} audioUrl={word.audioUrl} /></div>
        ) : (
          <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{word.english}</div>
        )}
      </div>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
        readOnly={!!verdict}
        placeholder="Type here, then Enter"
        className="w-full rounded-lg px-4 py-3 text-center text-lg outline-none"
        style={{ background: 'var(--s2)', border: `1px solid ${color}`, color: 'var(--text)' }}
      />

      {verdict ? (
        <div className="space-y-3 text-center">
          <div className="text-sm" style={{ color }}>
            {verdict.kind === 'correct' && 'Correct'}
            {verdict.kind === 'close' && 'Almost — small typo'}
            {verdict.kind === 'wrong' && 'Not quite'}
          </div>
          <div style={{ color: 'var(--text)' }}>
            {word.gender ? `${word.gender} ` : ''}{word.german}
            <span style={{ color: 'var(--text2)' }}> — {word.english}</span>
          </div>
          {word.example && <p className="text-sm italic" style={{ color: 'var(--text2)' }}>{word.example}</p>}
          <Button variant="primary" onClick={() => onGrade(verdict.grade)}>Continue (Enter)</Button>
        </div>
      ) : (
        <div className="flex justify-center gap-2">
          <Button variant="primary" onClick={submit}>Check</Button>
          <Button variant="ghost" onClick={reveal}>Reveal</Button>
        </div>
      )}
    </div>
  );
}
