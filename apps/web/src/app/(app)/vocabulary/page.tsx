'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useVocab } from '@/hooks/use-vocab';
import { WordList } from '@/components/vocabulary/word-list';
import { ImportModal } from '@/components/vocabulary/import-modal';
import { AddWordModal } from '@/components/vocabulary/add-word-modal';
import { UpgradeModal } from '@/components/upgrade-modal';
import { Button } from '@/components/ui/button';
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
    limit: 24,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vocabulary</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.total ?? 0} words saved
          </p>
        </div>
        <div className="flex gap-3">
          {data && data.total > 0 && (
            <Link href="/vocabulary/flashcards">
              <Button variant="secondary">Practice flashcards →</Button>
            </Link>
          )}
          {isPro ? (
            <Button onClick={() => setImportOpen(true)}>+ Import words (AI)</Button>
          ) : (
            <Button onClick={() => setAddOpen(true)}>+ Add word</Button>
          )}
        </div>
      </div>

      {/* Level filter */}
      <div className="flex gap-2 mb-6">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => { setLevel(l); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              level === l
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-brand-500" />
        </div>
      ) : (
        <>
          <WordList words={data?.data ?? []} />

          {/* Pagination */}
          {data && data.total > data.limit && (
            <div className="flex justify-center gap-3 mt-8">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </Button>
              <span className="text-sm text-gray-500 self-center">
                Page {page} of {Math.ceil(data.total / data.limit)}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= Math.ceil(data.total / data.limit)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
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
