'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface SmartPasteBoxProps {
  onPreview: (text: string) => void;
  loading: boolean;
}

export function SmartPasteBox({ onPreview, loading }: SmartPasteBoxProps) {
  const [text, setText] = useState('');
  const lineCount = text.split('\n').filter((l) => l.trim()).length;

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder={'Paste a list, one word per line. Any format:\nHund\nder Hund\nHund - dog\nder Hund, dog'}
        className="w-full resize-y rounded-xl p-4 text-sm outline-none"
        style={{ background: 'var(--s2)', border: '1px solid var(--line)', color: 'var(--text)' }}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text3)' }}>
          {lineCount} {lineCount === 1 ? 'line' : 'lines'} · Wiktionary fills gender/plural for free; Claude fills examples.
        </span>
        <Button variant="primary" loading={loading} disabled={lineCount === 0} onClick={() => onPreview(text)}>
          Preview
        </Button>
      </div>
    </div>
  );
}
