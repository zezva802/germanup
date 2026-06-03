'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@/components/words/icons';
import { SmartPasteBox } from '@/components/words/import/smart-paste-box';
import { AiQuotaNote } from '@/components/words/import/ai-quota-note';
import { PreviewTable, type EditableRow } from '@/components/words/import/preview-table';
import { DeckTagPicker } from '@/components/words/import/deck-tag-picker';
import { useImportPreview, useImportCommit, type CommitRow } from '@/hooks/use-import';
import type { CapUsage, ImportCommitResponse } from '@/types/words';

export default function ImportPage() {
  const router = useRouter();
  const preview = useImportPreview();
  const commit = useImportCommit();

  const [rows, setRows] = useState<EditableRow[] | null>(null);
  const [capUsage, setCapUsage] = useState<CapUsage | null>(null);
  const [deckId, setDeckId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [result, setResult] = useState<ImportCommitResponse | null>(null);
  const [error, setError] = useState('');

  const runPreview = async (text: string) => {
    setError('');
    setResult(null);
    try {
      const res = await preview.mutateAsync({ text });
      setRows(res.rows.map((r) => ({ ...r, selected: r.status !== 'duplicate', override: false })));
      setCapUsage(res.capUsage);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const toCommit = (rows ?? []).filter((r) => r.selected);
  const canCommit = !!deckId && toCommit.length > 0;

  const runCommit = async () => {
    setError('');
    try {
      const payload: CommitRow[] = toCommit.map((r) => ({
        german: r.german, english: r.english, gender: r.gender, plural: r.plural,
        example: r.example, partOfSpeech: r.partOfSpeech, level: r.level, source: r.source,
        status: r.status, override: r.override,
      }));
      const res = await commit.mutateAsync({ deckId, tagIds, rows: payload });
      setResult(res);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const reset = () => { setRows(null); setCapUsage(null); setResult(null); setError(''); };

  return (
    <div className="mx-auto w-full px-6 py-8" style={{ maxWidth: 920 }}>
      <button onClick={() => router.push('/words')} className="mb-4 inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80" style={{ color: 'var(--text2)' }}>
        <ArrowLeftIcon width={14} height={14} /> Back to words
      </button>

      <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Import words</h1>
      <p className="mb-6 mt-1 text-sm" style={{ color: 'var(--text2)' }}>Paste a list, review the enriched preview, then save into a deck.</p>

      {error && <p className="mb-4 text-sm" style={{ color: '#EF4444' }}>{error}</p>}

      {result ? (
        <div className="rounded-xl p-6" style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Imported {result.created} {result.created === 1 ? 'word' : 'words'}</h2>
          {result.skippedDuplicates > 0 && (
            <p className="mt-1 text-sm" style={{ color: 'var(--text2)' }}>{result.skippedDuplicates} duplicate {result.skippedDuplicates === 1 ? 'row was' : 'rows were'} skipped.</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="primary" onClick={() => router.push(`/words/${deckId}`)}>Open deck</Button>
            <Button variant="secondary" onClick={reset}>Import more</Button>
            <Button variant="ghost" onClick={() => router.push('/words')}>Back to words</Button>
          </div>
        </div>
      ) : (
        <>
          <SmartPasteBox onPreview={runPreview} loading={preview.isPending} />

          {rows && capUsage && (
            <div className="mt-6 space-y-4">
              <AiQuotaNote capUsage={capUsage} />
              {rows.length === 0 ? (
                <p className="py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>Nothing parsed from that text.</p>
              ) : (
                <>
                  <PreviewTable rows={rows} onChange={setRows} />
                  <DeckTagPicker deckId={deckId} onDeckId={setDeckId} tagIds={tagIds} onTagIds={setTagIds} />
                  <div className="sticky bottom-0 flex items-center justify-end gap-3 py-3" style={{ background: 'linear-gradient(to top, var(--bg), transparent)' }}>
                    <span className="text-sm" style={{ color: 'var(--text2)' }}>{toCommit.length} selected</span>
                    <Button variant="primary" loading={commit.isPending} disabled={!canCommit} onClick={runCommit}>
                      Import {toCommit.length} {toCommit.length === 1 ? 'word' : 'words'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
