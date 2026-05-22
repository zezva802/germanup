'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useVerbs, useImportVerb, useDeleteVerb, type UserVerb } from '@/hooks/use-verbs';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { UpgradeModal } from '@/components/upgrade-modal';

const PRONOUNS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'] as const;

function ConjugationTable({ verb }: { verb: UserVerb }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ background: 'var(--s3)' }}>
            <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text3)', borderBottom: '1px solid var(--line)' }}>Pronoun</th>
            <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text3)', borderBottom: '1px solid var(--line)' }}>Präsens</th>
            <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text3)', borderBottom: '1px solid var(--line)' }}>Imperfekt</th>
          </tr>
        </thead>
        <tbody>
          {PRONOUNS.map((p) => (
            <tr key={p} style={{ borderBottom: '1px solid var(--line)' }}>
              <td className="px-3 py-1.5 text-xs font-bold" style={{ color: 'var(--text2)' }}>{p}</td>
              <td className="px-3 py-1.5 text-sm" style={{ color: 'var(--text)' }}>{verb.praesens[p]}</td>
              <td className="px-3 py-1.5 text-sm" style={{ color: 'var(--text)' }}>{verb.imperfekt[p]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex gap-4 text-xs" style={{ color: 'var(--text3)' }}>
        <span>Partizip II: <strong style={{ color: 'var(--text2)' }}>{verb.partizip2}</strong></span>
        <span>Hilfsverb: <strong style={{ color: 'var(--text2)' }}>{verb.hilfsverb}</strong></span>
      </div>
      {verb.example && (
        <p className="mt-1 text-xs italic" style={{ color: 'var(--text3)' }}>{verb.example}</p>
      )}
    </div>
  );
}

function VerbCard({ verb }: { verb: UserVerb }) {
  const [expanded, setExpanded] = useState(false);
  const { mutate: del } = useDeleteVerb();

  return (
    <div
      className="rounded-xl p-4 transition-colors"
      style={{ background: 'var(--s2)', border: `1px solid ${expanded ? 'var(--line2)' : 'var(--line)'}` }}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 text-left flex-1"
        >
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>{verb.infinitive}</span>
          {verb.isIrregular && (
            <span
              className="px-2 py-0.5 text-xs rounded-full font-semibold"
              style={{ background: 'var(--amber-bg, rgba(251,178,36,0.1))', color: 'var(--amber)' }}
            >
              irregular
            </span>
          )}
          <span className="ml-auto text-xs" style={{ color: 'var(--text3)' }}>{expanded ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={() => del(verb.id)}
          className="ml-3 text-lg leading-none transition-colors"
          style={{ color: 'var(--text3)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
        >
          ×
        </button>
      </div>
      {expanded && <ConjugationTable verb={verb} />}
    </div>
  );
}

function ImportVerbModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState('');
  const { mutate, isPending, error } = useImportVerb();
  const [success, setSuccess] = useState(false);

  const handleImport = () => {
    const infinitive = input.trim();
    if (!infinitive) return;
    mutate(infinitive, {
      onSuccess: () => {
        setSuccess(true);
        setInput('');
        setTimeout(() => { setSuccess(false); onClose(); }, 1500);
      },
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Import verb">
      <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>
        Enter a German infinitive — Claude will generate all conjugations.
      </p>
      <input
        className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
        style={{
          background: 'var(--s3)',
          border: '1px solid var(--line2)',
          color: 'var(--text)',
        }}
        placeholder="e.g. sprechen"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleImport()}
        autoFocus
      />
      {error && <p className="text-sm mt-2" style={{ color: '#FCA5A5' }}>{(error as Error).message}</p>}
      {success && <p className="text-sm mt-2" style={{ color: 'var(--green)' }}>✓ Verb imported!</p>}
      <div className="flex gap-3 justify-end mt-4">
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
          style={{ background: 'var(--green)', color: 'var(--bg)' }}
          onClick={handleImport}
          disabled={isPending || !input.trim()}
        >
          {isPending ? 'Importing…' : 'Import'}
        </button>
      </div>
    </Modal>
  );
}

export default function VerbsPage() {
  const { data: session } = useSession();
  const isPro = session?.user && 'plan' in session.user && session.user.plan === 'PRO';
  const { data: verbs, isLoading } = useVerbs();
  const [importOpen, setImportOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const irregularVerbs = verbs?.filter((v) => v.isIrregular) ?? [];

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Verbs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            {verbs?.length ?? 0} verbs imported
          </p>
        </div>
        <div className="flex gap-2">
          {irregularVerbs.length > 0 && (
            <Link
              href="/verbs/practice"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--s2)', color: 'var(--text2)', border: '1px solid var(--line)' }}
            >
              Practice →
            </Link>
          )}
          <button
            onClick={() => (isPro ? setImportOpen(true) : setUpgradeOpen(true))}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            + Import verb{!isPro && ' (Pro)'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" style={{ color: 'var(--green)' } as React.CSSProperties} />
        </div>
      ) : verbs?.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text3)' }}>
          <p className="text-3xl mb-3">⏱</p>
          <p className="text-sm">No verbs yet — import your first verb to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {verbs?.map((verb) => <VerbCard key={verb.id} verb={verb} />)}
        </div>
      )}

      <ImportVerbModal open={importOpen} onClose={() => setImportOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
