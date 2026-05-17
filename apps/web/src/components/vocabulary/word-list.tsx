'use client';

import { useState } from 'react';
import type { VocabWord } from '@germanup/types';
import { useDeleteWord } from '@/hooks/use-vocab';
import { Button } from '@/components/ui/button';

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-100 text-green-700',
  A2: 'bg-yellow-100 text-yellow-700',
  A3: 'bg-orange-100 text-orange-700',
};

const GENDER_COLORS: Record<string, string> = {
  der: 'text-blue-600',
  die: 'text-pink-600',
  das: 'text-green-600',
};

interface WordListProps {
  words: VocabWord[];
}

export function WordList({ words }: WordListProps) {
  const { mutate: deleteWord } = useDeleteWord();
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setDeleting(id);
    deleteWord(id, { onSettled: () => setDeleting(null) });
  };

  if (!words.length) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-4xl mb-3">📚</p>
        <p>No words yet. Import your first batch!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {words.map((word) => (
        <div
          key={word.id}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className={GENDER_COLORS[word.gender ?? ''] ?? ''}>
                {word.gender && `${word.gender} `}
              </span>
              <span className="font-semibold text-gray-900">{word.german}</span>
              {word.plural && (
                <span className="text-gray-400 text-sm ml-1">(pl. {word.plural})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[word.level] ?? ''}`}>
                {word.level}
              </span>
              {word.flashcardStats?.mastered && (
                <span title="Mastered" className="text-green-500 text-sm">✓</span>
              )}
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-2">{word.english}</p>
          {word.example && (
            <p className="text-gray-400 text-xs italic">{word.example}</p>
          )}
          <div className="flex justify-end mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => handleDelete(word.id)}
              loading={deleting === word.id}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
