'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronIcon, PencilIcon, TrashIcon } from './icons';
import { ConjugationTableView } from './conjugation-table';
import type { Word } from '@/types/words';

const GENDER_COLOR: Record<string, string> = {
  der: '#60A5FA',
  die: '#F472B6',
  das: '#A78BFA',
};

interface WordRowProps {
  word: Word;
  editable?: boolean;
  onEdit?: (w: Word) => void;
  onDelete?: (w: Word) => void;
}

export function WordRow({ word, editable, onEdit, onDelete }: WordRowProps) {
  const [open, setOpen] = useState(false);
  const isVerb = word.partOfSpeech === 'VERB';
  const hasConjugation = isVerb && !!word.conjugation;
  const accent = word.gender ? GENDER_COLOR[word.gender] : 'var(--line2)';
  const headword = word.gender ? `${word.gender} ${word.german}` : word.german;

  return (
    <div className="rounded-lg" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
      <div
        className={cn('flex items-center gap-3 px-4 py-2.5', hasConjugation && 'cursor-pointer')}
        onClick={() => hasConjugation && setOpen((o) => !o)}
      >
        <span className="h-8 w-0.5 rounded-full" style={{ background: accent }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium" style={{ color: 'var(--text)' }}>{headword}</span>
            {word.plural && <span className="text-xs" style={{ color: 'var(--text3)' }}>pl. {word.plural}</span>}
          </div>
          <div className="truncate text-sm" style={{ color: 'var(--text2)' }}>{word.english}</div>
        </div>

        <div className="flex items-center gap-1.5">
          {word.tags?.map((t) => (
            <span key={t.tagId} className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}>
              {t.tag.name}
            </span>
          ))}
          <span className="rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide" style={{ color: 'var(--text3)', border: '1px solid var(--line)' }}>
            {word.partOfSpeech.toLowerCase()}
          </span>
        </div>

        {editable && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => onEdit?.(word)} className="rounded p-1 transition-colors hover:opacity-70" style={{ color: 'var(--text3)' }} aria-label="Edit">
              <PencilIcon width={14} height={14} />
            </button>
            <button onClick={() => onDelete?.(word)} className="rounded p-1 transition-colors hover:opacity-70" style={{ color: 'var(--text3)' }} aria-label="Delete">
              <TrashIcon width={14} height={14} />
            </button>
          </div>
        )}

        {hasConjugation && (
          <ChevronIcon width={16} height={16} style={{ color: 'var(--text3)', transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s' }} />
        )}
      </div>

      {open && hasConjugation && (
        <div className="border-t px-4 py-3" style={{ borderColor: 'var(--line)' }}>
          {word.example && <p className="mb-3 text-sm italic" style={{ color: 'var(--text2)' }}>{word.example}</p>}
          <ConjugationTableView conjugation={word.conjugation!} />
        </div>
      )}
    </div>
  );
}
