'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReviewMode } from '@/types/words';
import type { FlashDirection } from './flashcard-mode';

export type StudyDirection = FlashDirection | 'mixed';

interface ModePickerProps {
  dueCount: number;
  newCount: number;
  onStart: (mode: ReviewMode, direction: StudyDirection) => void;
}

const MODES: { mode: ReviewMode; label: string; desc: string }[] = [
  { mode: 'flashcard', label: 'Flashcards', desc: 'Flip and grade yourself' },
  { mode: 'type', label: 'Type', desc: 'Type the German' },
  { mode: 'listening', label: 'Listening', desc: 'Hear it, then type' },
];

const DIRECTIONS: { value: StudyDirection; label: string }[] = [
  { value: 'de-en', label: 'DE → EN' },
  { value: 'en-de', label: 'EN → DE' },
  { value: 'mixed', label: 'Mixed' },
];

export function ModePicker({ dueCount, newCount, onStart }: ModePickerProps) {
  const [mode, setMode] = useState<ReviewMode>('flashcard');
  const [direction, setDirection] = useState<StudyDirection>('de-en');

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: 'var(--text2)' }}>
        {dueCount} due · {newCount} new
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {MODES.map((m) => (
          <button
            key={m.mode}
            onClick={() => setMode(m.mode)}
            className={cn('rounded-xl p-4 text-left transition-colors')}
            style={{
              background: mode === m.mode ? 'var(--accent-bg)' : 'var(--s2)',
              border: `1px solid ${mode === m.mode ? 'var(--accent)' : 'var(--line)'}`,
              color: mode === m.mode ? 'var(--accent)' : 'var(--text)',
            }}
          >
            <div className="font-semibold">{m.label}</div>
            <div className="mt-0.5 text-xs" style={{ color: 'var(--text3)' }}>{m.desc}</div>
          </button>
        ))}
      </div>

      {mode === 'flashcard' && (
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Direction</div>
          <div className="flex gap-2">
            {DIRECTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDirection(d.value)}
                className="rounded-lg px-3 py-2 text-sm transition-colors"
                style={{
                  background: direction === d.value ? 'var(--accent-bg)' : 'var(--s2)',
                  border: `1px solid ${direction === d.value ? 'var(--accent)' : 'var(--line)'}`,
                  color: direction === d.value ? 'var(--accent)' : 'var(--text2)',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button variant="primary" size="lg" onClick={() => onStart(mode, direction)}>Start studying</Button>
    </div>
  );
}
