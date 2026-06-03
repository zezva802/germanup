'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SparklesIcon } from '@/components/words/icons';

interface ExtractTextBoxProps {
  onExtract: (text: string) => void;
  loading: boolean;
}

export function ExtractTextBox({ onExtract, loading }: ExtractTextBoxProps) {
  const [text, setText] = useState('');
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={'Paste a German passage. Claude pulls out the vocabulary — lemmatized, deduplicated, stopwords skipped — then enriches it like a normal import.'}
        className="w-full resize-y rounded-xl p-4 text-sm outline-none"
        style={{ background: 'var(--s2)', border: '1px solid var(--line)', color: 'var(--text)' }}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text3)' }}>
          {wordCount} {wordCount === 1 ? 'word' : 'words'} · Pro · counts against your daily extract limit.
        </span>
        <Button variant="primary" loading={loading} disabled={wordCount === 0} onClick={() => onExtract(text)}>
          <SparklesIcon width={14} height={14} /> Extract vocabulary
        </Button>
      </div>
    </div>
  );
}
