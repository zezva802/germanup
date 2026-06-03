'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon } from '@/components/words/icons';
import { SmartPasteBox } from '@/components/words/import/smart-paste-box';
import { ExtractTextBox } from '@/components/words/import/extract-text-box';
import { AiQuotaNote } from '@/components/words/import/ai-quota-note';
import { PreviewTable, type EditableRow } from '@/components/words/import/preview-table';
import { DeckTagPicker } from '@/components/words/import/deck-tag-picker';
import { ProLock } from '@/components/words/pro-lock';
import { useImportPreview, useImportCommit, useExtract, type CommitRow } from '@/hooks/use-import';
import { useSubscriptionStatus } from '@/hooks/use-subscription';
import type { CapUsage, ImportCommitResponse, ImportPreviewResponse } from '@/types/words';

type Tab = 'paste' | 'extract';

export default function ImportPage() {
  const router = useRouter();
  const preview = useImportPreview();
  const extract = useExtract();
  const commit = useImportCommit();
  const { data: subscription } = useSubscriptionStatus();
  const isPro = subscription?.plan === 'PRO';

  const [tab, setTab] = useState<Tab>('paste');
  const [rows, setRows] = useState<EditableRow[] | null>(null);
  const [capUsage, setCapUsage] = useState<CapUsage | null>(null);
  const [deckId, setDeckId] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [result, setResult] = useState<ImportCommitResponse | null>(null);
  const [error, setError] = useState('');

  const applyPreview = (res: ImportPreviewResponse) => {
    setRows(res.rows.map((r) => ({ ...r, selected: r.status !== 'duplicate', override: false })));
    setCapUsage(res.capUsage);
  };

  const runPreview = async (text: string) => {
    setError('');
    setResult(null);
    try {
      applyPreview(await preview.mutateAsync({ text }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const runExtract = async (text: string) => {
    setError('');
    setResult(null);
    try {
      applyPreview(await extract.mutateAsync({ text }));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setRows(null);
    setCapUsage(null);
    setResult(null);
    setError('');
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
      <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--text2)' }}>Paste a list or extract from a passage, review the enriched preview, then save into a deck.</p>

      {!result && (
        <div className="mb-6 inline-flex gap-1 rounded-xl p-1" style={{ background: 'var(--s1)', border: '1px solid var(--line)' }}>
          {([['paste', 'Paste list'], ['extract', 'Extract from text']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
              style={tab === key
                ? { background: 'var(--s3)', color: 'var(--text)' }
                : { background: 'transparent', color: 'var(--text2)' }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

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
          {tab === 'paste' ? (
            <SmartPasteBox onPreview={runPreview} loading={preview.isPending} />
          ) : isPro ? (
            <ExtractTextBox onExtract={runExtract} loading={extract.isPending} />
          ) : (
            <ProLock
              feature="Extract from text"
              hint="Paste any German passage and let Claude pull out the vocabulary for you."
            />
          )}

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
