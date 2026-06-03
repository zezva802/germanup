'use client';

import { WordRow } from './word-row';
import type { Word } from '@/types/words';

interface WordTableProps {
  words: Word[];
  editableWordIds?: Set<string>;
  onEdit?: (w: Word) => void;
  onDelete?: (w: Word) => void;
  emptyText?: string;
}

export function WordTable({ words, editableWordIds, onEdit, onDelete, emptyText = 'No words yet.' }: WordTableProps) {
  if (words.length === 0) {
    return <p className="py-10 text-center text-sm" style={{ color: 'var(--text3)' }}>{emptyText}</p>;
  }
  return (
    <div className="space-y-1.5">
      {words.map((w) => (
        <WordRow
          key={w.id}
          word={w}
          editable={editableWordIds ? editableWordIds.has(w.id) : !!w.ownerId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
