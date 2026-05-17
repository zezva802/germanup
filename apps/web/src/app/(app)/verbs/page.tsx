'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useVerbs, useImportVerb, useDeleteVerb, type UserVerb } from '@/hooks/use-verbs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Modal } from '@/components/ui/modal';
import { UpgradeModal } from '@/components/upgrade-modal';

const PRONOUNS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'] as const;

function ConjugationTable({ verb }: { verb: UserVerb }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-3 py-2 font-medium text-gray-600 border border-gray-200">Pronoun</th>
            <th className="text-left px-3 py-2 font-medium text-gray-600 border border-gray-200">Präsens</th>
            <th className="text-left px-3 py-2 font-medium text-gray-600 border border-gray-200">Imperfekt</th>
          </tr>
        </thead>
        <tbody>
          {PRONOUNS.map((p) => (
            <tr key={p} className="hover:bg-gray-50">
              <td className="px-3 py-1.5 border border-gray-200 font-medium text-gray-700">{p}</td>
              <td className="px-3 py-1.5 border border-gray-200">{verb.praesens[p]}</td>
              <td className="px-3 py-1.5 border border-gray-200">{verb.imperfekt[p]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 text-xs text-gray-500 space-x-3">
        <span>Partizip II: <strong>{verb.partizip2}</strong></span>
        <span>Hilfsverb: <strong>{verb.hilfsverb}</strong></span>
      </div>
      <p className="mt-1 text-xs text-gray-500 italic">{verb.example}</p>
    </div>
  );
}

function VerbCard({ verb }: { verb: UserVerb }) {
  const [expanded, setExpanded] = useState(false);
  const { mutate: del } = useDeleteVerb();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 text-left flex-1"
        >
          <span className="text-base font-semibold text-gray-900">{verb.infinitive}</span>
          {verb.isIrregular && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
              irregular
            </span>
          )}
          <span className="ml-auto text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
        </button>
        <button
          onClick={() => del(verb.id)}
          className="ml-3 text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
          title="Delete"
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
      <p className="text-sm text-gray-600 mb-3">
        Enter a German infinitive. Claude will generate all conjugations.
      </p>
      <input
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        placeholder="e.g. sprechen"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleImport()}
        autoFocus
      />
      {error && <p className="text-sm text-red-600 mt-2">{(error as Error).message}</p>}
      {success && <p className="text-sm text-green-600 mt-2">✓ Verb imported!</p>}
      <div className="flex gap-3 justify-end mt-4">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>Cancel</Button>
        <Button onClick={handleImport} loading={isPending} disabled={!input.trim()}>
          {isPending ? 'Importing…' : 'Import'}
        </Button>
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verbs</h1>
          <p className="text-gray-500 text-sm mt-1">{verbs?.length ?? 0} verbs imported</p>
        </div>
        <div className="flex gap-3">
          {irregularVerbs.length > 0 && (
            <Link href="/verbs/practice">
              <Button variant="secondary">Practice conjugation →</Button>
            </Link>
          )}
          <Button
            onClick={() => (isPro ? setImportOpen(true) : setUpgradeOpen(true))}
          >
            + Import verb{!isPro && ' (Pro)'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8 text-brand-500" />
        </div>
      ) : verbs?.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">No verbs yet</p>
          <p className="text-sm">Import your first verb to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {verbs?.map((verb) => <VerbCard key={verb.id} verb={verb} />)}
        </div>
      )}

      <ImportVerbModal open={importOpen} onClose={() => setImportOpen(false)} />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}
