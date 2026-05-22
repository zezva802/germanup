'use client';

import { useState } from 'react';
import {
  useAdminStats,
  useAdminExercises,
  useUpdateExercise,
  useDeleteExercise,
  useDeleteAllExercises,
  useImportExercises,
  type AdminExercise,
} from '@/hooks/use-admin';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const TOPICS = [
  'praesens','noun-gender','cases','personal-pronouns','possessive-pronouns',
  'modal-verbs','dativ-prepositions','akkusativ-prepositions','two-way-prepositions',
  'imperative','separable-verbs','future-werden','numbers-dates-time',
];
const TYPES = ['FILL_BLANK','MULTIPLE_CHOICE','TRANSLATE','FREE_WRITE','SORT','BUILD','ERROR_SPOT'];
const DIFFICULTIES = ['EASY','MEDIUM','HARD'];

const IMPORT_TEMPLATE = JSON.stringify([
  {
    topic: "cases",
    level: "A1",
    type: "FILL_BLANK",
    question: "Ich sehe ___ Mann. (der)",
    answer: "den",
    explanation: "Accusative case: der → den for masculine nouns.",
    difficulty: "EASY",
    options: null,
  },
  {
    topic: "cases",
    level: "A1",
    type: "MULTIPLE_CHOICE",
    question: "Which article is correct? Ich gebe ___ Frau das Buch.",
    answer: "der",
    explanation: "Dative case: die → der for feminine nouns.",
    difficulty: "MEDIUM",
    options: ["die", "der", "das", "den"],
  },
], null, 2);

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  exercise,
  onClose,
}: {
  exercise: AdminExercise;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...exercise });
  const [optionsText, setOptionsText] = useState(
    exercise.options ? exercise.options.join('\n') : '',
  );
  const update = useUpdateExercise();

  const set = (k: keyof AdminExercise, v: string | null) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    const options =
      form.type === 'MULTIPLE_CHOICE'
        ? optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
        : null;
    update.mutate(
      { id: exercise.id, data: { ...form, options } },
      { onSuccess: onClose },
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Edit Exercise</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase">Topic</label>
              <select
                value={form.topic}
                onChange={(e) => set('topic', e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {TOPICS.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase">Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value as AdminExercise['type'])}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value as AdminExercise['difficulty'])}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium uppercase">Question</label>
            <textarea
              value={form.question}
              onChange={(e) => set('question', e.target.value)}
              rows={3}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium uppercase">Answer</label>
            <input
              value={form.answer}
              onChange={(e) => set('answer', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {form.type === 'MULTIPLE_CHOICE' && (
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase">
                Options (one per line — correct answer must match the Answer field)
              </label>
              <textarea
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                rows={4}
                className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 font-medium uppercase">Explanation</label>
            <textarea
              value={form.explanation}
              onChange={(e) => set('explanation', e.target.value)}
              rows={2}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-medium uppercase">Image URL (optional)</label>
            <input
              value={form.imageUrl ?? ''}
              onChange={(e) => set('imageUrl', e.target.value || null)}
              placeholder="/prepositions/auf.png"
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="mt-2 h-24 object-contain rounded border border-gray-200" />
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={update.isPending}>Save</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────
function ImportModal({ onClose }: { onClose: () => void }) {
  const [json, setJson] = useState('');
  const [parseError, setParseError] = useState('');
  const importEx = useImportExercises();

  const handleImport = () => {
    setParseError('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setParseError('Invalid JSON — check the format');
      return;
    }
    if (!Array.isArray(parsed)) {
      setParseError('Must be a JSON array [ ... ]');
      return;
    }
    importEx.mutate(parsed as Parameters<typeof importEx.mutate>[0], {
      onSuccess: (data) => {
        alert(`Imported ${data.imported} exercises`);
        onClose();
      },
      onError: (e) => setParseError((e as Error).message),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-gray-900">Import Exercises</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-3">
          <p className="text-sm text-gray-600">
            Paste a JSON array of exercises. Each item needs:
            <code className="ml-1 bg-gray-100 px-1 rounded text-xs">topic, level, type, question, answer, explanation, difficulty</code>
          </p>

          <details className="text-xs">
            <summary className="cursor-pointer text-brand-600 font-medium">Show template</summary>
            <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto text-xs">
              {IMPORT_TEMPLATE}
            </pre>
          </details>

          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='[{"topic": "cases", "level": "A1", "type": "FILL_BLANK", ...}]'
            rows={16}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono"
          />

          {parseError && (
            <p className="text-red-600 text-sm font-medium">⚠️ {parseError}</p>
          )}
        </div>
        <div className="px-6 py-4 border-t flex justify-between items-center">
          <span className="text-xs text-gray-400">
            Tip: generate exercises with Claude then paste here
          </span>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleImport} loading={importEx.isPending}>
              Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminExercisesPage() {
  const [topicFilter, setTopicFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminExercise | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const { data: stats } = useAdminStats();
  const { data: result, isLoading } = useAdminExercises({
    topic: topicFilter || undefined,
    type: typeFilter || undefined,
    difficulty: diffFilter || undefined,
    page,
  });

  const deleteOne = useDeleteExercise();
  const deleteAll = useDeleteAllExercises();

  const handleDeleteAll = () => {
    deleteAll.mutate(undefined, {
      onSuccess: (d) => {
        alert(`Deleted ${d.deleted} exercises`);
        setConfirmDeleteAll(false);
      },
    });
  };

  const diffColor = (d: string) =>
    d === 'EASY' ? 'bg-green-100 text-green-700' :
    d === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
    'bg-red-100 text-red-700';

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exercises</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {stats?.total ?? '—'} total exercises across {Object.keys(stats?.byTopic ?? {}).length} topics
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => setImportOpen(true)}>
            + Import JSON
          </Button>
          <Button
            variant="secondary"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setConfirmDeleteAll(true)}
          >
            Delete All
          </Button>
        </div>
      </div>

      {/* Stats by topic */}
      {stats && Object.keys(stats.byTopic).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
          {Object.entries(stats.byTopic)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([topic, counts]) => (
              <button
                key={topic}
                onClick={() => { setTopicFilter(topic); setPage(1); }}
                className={cn(
                  'text-left bg-white border rounded-xl px-3 py-2 text-sm hover:shadow-sm transition-shadow',
                  topicFilter === topic ? 'border-brand-500 bg-brand-50' : 'border-gray-200',
                )}
              >
                <p className="font-medium text-gray-800 truncate">{topic}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {counts.total} · E:{counts.EASY} M:{counts.MEDIUM} H:{counts.HARD}
                </p>
              </button>
            ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={topicFilter}
          onChange={(e) => { setTopicFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All topics</option>
          {TOPICS.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          {TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <select
          value={diffFilter}
          onChange={(e) => { setDiffFilter(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
        {(topicFilter || typeFilter || diffFilter) && (
          <button
            onClick={() => { setTopicFilter(''); setTypeFilter(''); setDiffFilter(''); setPage(1); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}
        <span className="text-sm text-gray-500 ml-auto self-center">
          {result?.total ?? 0} matching exercises
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-28">Topic</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-20">Diff</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Question</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-24">Answer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-16">Shown</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">No exercises found</td>
                </tr>
              )}
              {result?.data.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">{ex.topic}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{ex.type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', diffColor(ex.difficulty))}>
                      {ex.difficulty[0]}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-gray-800">{ex.question}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-brand-700">{ex.answer}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {ex.timesShown > 0 ? `${ex.timesShown} / ${ex.timesCorrect}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(ex)}
                        className="p-1.5 text-gray-400 hover:text-brand-600 rounded"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this exercise?')) deleteOne.mutate(ex.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {result && result.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <Button variant="secondary" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
            ←
          </Button>
          <span className="text-sm text-gray-600">Page {page} of {result.pages}</span>
          <Button variant="secondary" onClick={() => setPage((p) => p + 1)} disabled={page === result.pages}>
            →
          </Button>
        </div>
      )}

      {/* Confirm delete all */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">Delete all exercises?</h3>
            <p className="text-sm text-gray-600 mb-6">
              This will permanently delete all {stats?.total ?? '—'} exercises. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setConfirmDeleteAll(false)}>Cancel</Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteAll}
                loading={deleteAll.isPending}
              >
                Yes, delete all
              </Button>
            </div>
          </div>
        </div>
      )}

      {editing && <EditModal exercise={editing} onClose={() => setEditing(null)} />}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
    </div>
  );
}
