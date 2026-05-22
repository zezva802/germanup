'use client';

import { useState } from 'react';
import type { VocabWord } from '@germanup/types';
import { useDeleteWord } from '@/hooks/use-vocab';

const GENDER_COLOR: Record<string, string> = {
  der: '#60A5FA',
  die: '#F472B6',
  das: '#A78BFA',
};

const GENDER_BG: Record<string, string> = {
  der: 'rgba(96,165,250,0.08)',
  die: 'rgba(244,114,182,0.08)',
  das: 'rgba(167,139,250,0.08)',
};

interface WordListProps {
  words: VocabWord[];
}

export function WordList({ words }: WordListProps) {
  const { mutate: deleteWord } = useDeleteWord();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [hovering, setHovering] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleting(id);
    deleteWord(id, { onSettled: () => setDeleting(null) });
  };

  if (!words.length) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
        <p className="text-3xl mb-3">📚</p>
        <p className="text-sm">No words yet. Add your first word to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-px">
      {words.map((word) => {
        const gColor = word.gender ? GENDER_COLOR[word.gender] : undefined;
        const gBg    = word.gender ? GENDER_BG[word.gender]    : undefined;
        const isHov  = hovering === word.id;

        return (
          <div
            key={word.id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors cursor-default group"
            style={{ background: isHov ? 'var(--s2)' : 'transparent' }}
            onMouseEnter={() => setHovering(word.id)}
            onMouseLeave={() => setHovering(null)}
          >
            {/* Colored gender strip */}
            {gColor && (
              <div
                className="self-stretch rounded-full shrink-0"
                style={{ width: 3, background: gColor, minHeight: 20 }}
              />
            )}

            {/* Article */}
            {word.gender && (
              <span
                className="text-xs font-bold w-6 shrink-0"
                style={{ color: gColor }}
              >
                {word.gender}
              </span>
            )}

            {/* German word */}
            <span
              className="font-bold min-w-[130px]"
              style={{ fontSize: 14.5, color: 'var(--text)' }}
            >
              {word.german}
            </span>

            {/* Plural */}
            {word.plural && (
              <span
                className="text-xs min-w-[80px]"
                style={{ color: 'var(--text3)' }}
              >
                pl. {word.plural}
              </span>
            )}

            {/* English */}
            <span
              className="flex-1 text-sm"
              style={{ color: 'var(--text2)' }}
            >
              {word.english}
            </span>

            {/* Level badge */}
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
              style={gBg
                ? { background: gBg, color: gColor }
                : { background: 'var(--s3)', color: 'var(--text3)' }
              }
            >
              {word.level}
            </span>

            {/* Mastered */}
            {word.flashcardStats?.mastered && (
              <span className="text-xs shrink-0" style={{ color: 'var(--green)' }}>✓</span>
            )}

            {/* Delete */}
            <button
              className="opacity-0 group-hover:opacity-100 text-sm transition-opacity shrink-0"
              style={{ color: '#EF4444' }}
              onClick={() => handleDelete(word.id)}
              disabled={deleting === word.id}
            >
              {deleting === word.id ? '…' : '×'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
