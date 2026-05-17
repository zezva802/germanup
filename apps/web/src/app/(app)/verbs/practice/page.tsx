'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useVerbs, usePracticeSession, useConjugationResult, type PracticeItem } from '@/hooks/use-verbs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { UpgradeModal } from '@/components/upgrade-modal';

type Tense = 'praesens' | 'imperfekt' | 'both';

// ── Selection screen ──────────────────────────────────────────────────────────

function SelectionScreen({
  onStart,
}: {
  onStart: (verbIds: string[], tense: Tense) => void;
}) {
  const { data: verbs, isLoading } = useVerbs();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tense, setTense] = useState<Tense>('praesens');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { data: session } = useSession();
  const isPro = session?.user && 'plan' in session.user && session.user.plan === 'PRO';

  const irregularVerbs = verbs?.filter((v) => v.isIrregular) ?? [];

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    const ids = [...selected];
    if (!isPro && ids.length > 3) {
      setUpgradeOpen(true);
      return;
    }
    onStart(ids, tense);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  if (irregularVerbs.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>No irregular verbs yet. Import some verbs first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Practice Conjugation</h1>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">Select verbs to practice</p>
        <div className="space-y-2">
          {irregularVerbs.map((verb) => (
            <label
              key={verb.id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.has(verb.id)}
                onChange={() => toggle(verb.id)}
                className="accent-brand-600"
              />
              <span className="font-medium text-gray-900">{verb.infinitive}</span>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">irregular</span>
            </label>
          ))}
        </div>
        {!isPro && selected.size > 3 && (
          <p className="mt-2 text-xs text-amber-600">
            Free plan: up to 3 verbs per session. Upgrade for unlimited.
          </p>
        )}
      </div>

      <div className="mb-8">
        <p className="text-sm font-medium text-gray-700 mb-3">Select tense</p>
        <div className="flex gap-3">
          {(['praesens', 'imperfekt', 'both'] as Tense[]).map((t) => (
            <button
              key={t}
              onClick={() => setTense(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                tense === t
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {t === 'both' ? 'Both' : t === 'praesens' ? 'Präsens' : 'Imperfekt'}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleStart}
        disabled={selected.size === 0}
        size="lg"
        className="w-full"
      >
        Start practice →
      </Button>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}

// ── Practice drill ────────────────────────────────────────────────────────────

interface Result {
  item: PracticeItem;
  userAnswer: string;
  correct: boolean;
}

function PracticeDrill({
  verbIds,
  tense,
  onDone,
}: {
  verbIds: string[];
  tense: Tense;
  onDone: (results: Result[]) => void;
}) {
  const { data: items, isLoading } = usePracticeSession({ verbIds, tense });
  const { mutate: recordResult } = useConjugationResult();
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!submitted) inputRef.current?.focus();
  }, [idx, submitted]);

  if (isLoading || !items) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p>No irregular verbs found for the selected options.</p>
      </div>
    );
  }

  const current = items[idx];

  const handleSubmit = () => {
    if (!current || submitted) return;
    const correct = input.trim().toLowerCase() === current.answer.toLowerCase();

    recordResult({
      verbId: current.verbId,
      pronoun: current.pronoun,
      tense: current.tense,
      correct,
    });

    const result: Result = { item: current, userAnswer: input.trim(), correct };
    setResults((prev) => [...prev, result]);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (idx + 1 >= items.length) {
      onDone([...results]);
    } else {
      setIdx((i) => i + 1);
      setInput('');
      setSubmitted(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitted ? handleNext() : handleSubmit();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-sm text-gray-500 mb-6">
        {idx + 1} / {items.length}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center mb-6">
        <p className="text-sm text-gray-500 mb-1 capitalize">{current.tense}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">{current.infinitive}</p>
        <p className="text-xl text-brand-600 font-semibold">{current.pronoun} ___</p>
      </div>

      <input
        ref={inputRef}
        className={`w-full px-4 py-3 border-2 rounded-xl text-center text-lg font-medium focus:outline-none transition-colors ${
          submitted
            ? results[results.length - 1]?.correct
              ? 'border-green-400 bg-green-50 text-green-800'
              : 'border-red-400 bg-red-50 text-red-800'
            : 'border-gray-300 focus:border-brand-500'
        }`}
        placeholder="Type conjugation..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        disabled={submitted}
      />

      {submitted && !results[results.length - 1]?.correct && (
        <p className="text-center mt-2 text-sm text-gray-600">
          Correct answer: <span className="font-semibold text-gray-900">{current.answer}</span>
        </p>
      )}

      {submitted && results[results.length - 1]?.correct && (
        <p className="text-center mt-2 text-sm text-green-600 font-medium">Correct!</p>
      )}

      <div className="flex gap-3 mt-6">
        {!submitted ? (
          <Button onClick={handleSubmit} disabled={!input.trim()} className="flex-1">
            Check
          </Button>
        ) : (
          <Button onClick={handleNext} className="flex-1">
            {idx + 1 >= items.length ? 'See results →' : 'Next →'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Summary screen ────────────────────────────────────────────────────────────

function SummaryScreen({
  results,
  onRestart,
}: {
  results: Result[];
  onRestart: () => void;
}) {
  const correct = results.filter((r) => r.correct).length;
  const verbGroups = results.reduce<Record<string, Result[]>>((acc, r) => {
    const key = r.item.infinitive;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Session complete</h2>
      <p className="text-gray-500 mb-6">
        Score: <span className="font-semibold text-gray-900">{correct}/{results.length}</span>
      </p>

      <div className="space-y-4 mb-8">
        {Object.entries(verbGroups).map(([infinitive, verbResults]) => {
          const verbCorrect = verbResults.filter((r) => r.correct).length;
          const weak = verbResults.filter((r) => !r.correct);

          return (
            <div key={infinitive} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">{infinitive}</span>
                <span className="text-sm text-gray-500">{verbCorrect}/{verbResults.length}</span>
              </div>
              {weak.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-600 font-medium mb-1">Needs work:</p>
                  <div className="space-y-1">
                    {weak.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className="text-red-400">✗</span>
                        <span className="capitalize">{r.item.tense}</span>
                        <span className="font-medium">{r.item.pronoun}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-900">{r.item.answer}</span>
                        <span className="text-gray-400">(you: {r.userAnswer || '—'})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button onClick={onRestart} size="lg" className="w-full">
        Practice again
      </Button>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

type Screen = 'select' | 'drill' | 'summary';

export default function VerbsPracticePage() {
  const [screen, setScreen] = useState<Screen>('select');
  const [verbIds, setVerbIds] = useState<string[]>([]);
  const [tense, setTense] = useState<Tense>('praesens');
  const [results, setResults] = useState<Result[]>([]);

  if (screen === 'select') {
    return (
      <SelectionScreen
        onStart={(ids, t) => {
          setVerbIds(ids);
          setTense(t);
          setScreen('drill');
        }}
      />
    );
  }

  if (screen === 'drill') {
    return (
      <PracticeDrill
        verbIds={verbIds}
        tense={tense}
        onDone={(r) => {
          setResults(r);
          setScreen('summary');
        }}
      />
    );
  }

  return <SummaryScreen results={results} onRestart={() => setScreen('select')} />;
}
