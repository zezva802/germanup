'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useVocab } from '@/hooks/use-vocab';
import { WordList } from '@/components/vocabulary/word-list';
import { ImportModal } from '@/components/vocabulary/import-modal';
import { AddWordModal } from '@/components/vocabulary/add-word-modal';
import { UpgradeModal } from '@/components/upgrade-modal';
import { Spinner } from '@/components/ui/spinner';

const LEVELS = ['All', 'A1', 'A2', 'A3'] as const;

export default function VocabularyPage() {
  const { data: session } = useSession();
  const isPro = session?.user && 'plan' in session.user && session.user.plan === 'PRO';
  const [level, setLevel] = useState<string>('All');
  const [page, setPage] = useState(1);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const { data, isLoading } = useVocab({
    level: level === 'All' ? undefined : level,
    page,
    limit: 40,
  });

  return (
    <div style={{ maxWidth: 780 }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            Vocabulary
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            {data?.total ?? 0} words · {isPro ? 'Pro — AI import enabled' : 'Free plan'}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {data && data.total > 0 && (
            <Link
              href="/vocabulary/flashcards"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--s2)', color: 'var(--text2)', border: '1px solid var(--line)' }}
            >
              Flashcards →
            </Link>
          )}
          {isPro ? (
            <button
              onClick={() => setImportOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: 'var(--s2)', color: 'var(--text2)', border: '1px solid var(--line)' }}
            >
              ↑ Import (AI)
            </button>
          ) : null}
          <button
            onClick={() => setAddOpen(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            + Add word
          </button>
        </div>
      </div>

      {/* Level filter */}
      <div className="flex gap-1.5 mb-5">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => { setLevel(l); setPage(1); }}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
            style={
              level === l
                ? { background: 'var(--text)', color: 'var(--bg)' }
                : { background: 'transparent', color: 'var(--text2)', border: '1px solid var(--line)' }
            }
          >
            {l}
          </button>
        ))}
      </div>

      {/* Word list */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" style={{ color: 'var(--green)' } as React.CSSProperties} />
        </div>
      ) : (
        <>
          <WordList words={data?.data ?? []} />

          {/* Pagination */}
          {data && data.total > data.limit && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-opacity hover:opacity-75"
                style={{ background: 'var(--s2)', color: 'var(--text2)', border: '1px solid var(--line)' }}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              <span className="text-xs" style={{ color: 'var(--text3)' }}>
                {page} / {Math.ceil(data.total / data.limit)}
              </span>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 transition-opacity hover:opacity-75"
                style={{ background: 'var(--s2)', color: 'var(--text2)', border: '1px solid var(--line)' }}
                disabled={page >= Math.ceil(data.total / data.limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <AddWordModal open={addOpen} onClose={() => setAddOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
