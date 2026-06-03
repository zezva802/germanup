'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useImportDeck } from '@/hooks/use-decks';

export function DeckFileImport() {
  const router = useRouter();
  const importDeck = useImportDeck();
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  const onFile = async (file: File) => {
    setError('');
    setFileName(file.name);
    try {
      const data = JSON.parse(await file.text()) as { words?: unknown };
      if (!data || !Array.isArray(data.words)) {
        setError('That file does not look like a deck export.');
        return;
      }
      const deck = await importDeck.mutateAsync(data);
      router.push(`/words/${deck.id}`);
    } catch (e) {
      setError((e as Error).message || 'Could not read that file.');
    }
  };

  return (
    <div className="rounded-xl p-5" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
      <p className="text-sm" style={{ color: 'var(--text2)' }}>
        Import a deck file you exported earlier. It becomes a new deck in your account — your existing decks are untouched.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <label
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--s3)', border: '1px solid var(--line)', color: 'var(--text)' }}
        >
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = '';
            }}
          />
          Choose deck file
        </label>
        {fileName && <span className="text-xs" style={{ color: 'var(--text3)' }}>{fileName}</span>}
        {importDeck.isPending && <span className="text-xs" style={{ color: 'var(--text3)' }}>Importing…</span>}
      </div>
      {error && <p className="mt-2 text-sm" style={{ color: '#EF4444' }}>{error}</p>}
    </div>
  );
}
