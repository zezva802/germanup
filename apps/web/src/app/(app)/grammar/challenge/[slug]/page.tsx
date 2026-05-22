'use client';

import { useMemo, useState, useCallback } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CHALLENGES } from '@germanup/types';
import { useProgress } from '@/hooks/use-progress';
import { useExercises } from '@/hooks/use-exercises';
import { getRank } from '@/lib/ranks';
import { cn } from '@/lib/utils';
import type { Exercise } from '@germanup/types';

const TOPIC_LABELS: Record<string, string> = {
  praesens: 'Präsens',
  'noun-gender': 'der / die / das',
  cases: 'Cases (Nom/Akk/Dat)',
  'personal-pronouns': 'Personal Pronouns',
  'possessive-pronouns': 'Possessive Pronouns',
  'modal-verbs': 'Modal Verbs',
  'dativ-prepositions': 'Dativ Prepositions',
  'akkusativ-prepositions': 'Akkusativ Prepositions',
  'two-way-prepositions': 'Two-Way Prepositions',
  imperative: 'Imperative',
  'separable-verbs': 'Separable Verbs',
  'future-werden': 'Future with werden',
  'numbers-dates-time': 'Numbers / Dates / Time',
};

// ─── Phase indicator ──────────────────────────────────────────────────────────

function PhaseIndicator({
  phase,
  labels,
}: {
  phase: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center justify-center mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                i < phase
                  ? 'bg-green-500 text-white'
                  : i === phase
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-200 text-gray-500',
              )}
            >
              {i < phase ? '✓' : i + 1}
            </div>
            <p className={cn('text-xs mt-1 font-medium', i === phase ? 'text-brand-600' : 'text-gray-400')}>
              {label}
            </p>
          </div>
          {i < labels.length - 1 && (
            <div
              className={cn('h-0.5 w-10 mx-2 mb-4 transition-colors', i < phase ? 'bg-green-500' : 'bg-gray-200')}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Sort exercise ────────────────────────────────────────────────────────────

function SortExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise;
  onResult: (correct: boolean) => void;
}) {
  const answerMap = useMemo(
    () => JSON.parse(exercise.answer) as Record<string, string>,
    [exercise.answer],
  );
  const categories = useMemo(() => [...new Set(Object.values(answerMap))], [answerMap]);
  const items = (exercise.options as string[]) ?? [];

  const [selected, setSelected] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const unassigned = items.filter((item) => !assignments[item]);
  const allAssigned = unassigned.length === 0;

  function handleItemClick(item: string) {
    if (submitted) return;
    setSelected((prev) => (prev === item ? null : item));
  }

  function handleCategoryClick(category: string) {
    if (submitted || !selected) return;
    setAssignments((prev) => ({ ...prev, [selected]: category }));
    setSelected(null);
  }

  function handleItemInBucketClick(e: React.MouseEvent, item: string) {
    e.stopPropagation();
    if (submitted) return;
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[item];
      return next;
    });
    setSelected(item);
  }

  function handleCheck() {
    const isCorrect = Object.entries(assignments).every(
      ([item, cat]) => answerMap[item] === cat,
    );
    setCorrect(isCorrect);
    setSubmitted(true);
    onResult(isCorrect);
  }

  return (
    <div>
      {/* Unassigned pool */}
      <div className="flex flex-wrap gap-2 min-h-14 p-3 mb-5 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        {unassigned.length === 0 ? (
          <p className="text-sm text-gray-400 self-center w-full text-center">
            All placed — check your answers
          </p>
        ) : (
          unassigned.map((item) => (
            <button
              key={item}
              onClick={() => handleItemClick(item)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                selected === item
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-gray-800 border-gray-300 hover:border-brand-400',
              )}
            >
              {item}
            </button>
          ))
        )}
      </div>

      {/* Category buckets */}
      <div
        className="grid gap-3 mb-5"
        style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}
      >
        {categories.map((category) => {
          const itemsInBucket = Object.entries(assignments)
            .filter(([, cat]) => cat === category)
            .map(([item]) => item);

          return (
            <div
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={cn(
                'min-h-28 p-3 rounded-xl border-2 transition-all',
                submitted
                  ? 'border-gray-200 bg-gray-50 cursor-default'
                  : selected
                    ? 'border-brand-400 bg-brand-50 cursor-pointer'
                    : 'border-gray-200 bg-gray-50 cursor-default',
              )}
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                {category}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {itemsInBucket.map((item) => {
                  const isRight = submitted && answerMap[item] === category;
                  const isWrong = submitted && answerMap[item] !== category;
                  return (
                    <button
                      key={item}
                      onClick={(e) => handleItemInBucketClick(e, item)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                        isRight
                          ? 'bg-green-100 text-green-800 border-green-300 cursor-default'
                          : isWrong
                            ? 'bg-red-100 text-red-800 border-red-300 cursor-default'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-red-300',
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {submitted && !correct && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
          <p className="text-xs font-semibold text-gray-700 mb-1">Correct answers:</p>
          {categories.map((cat) => (
            <p key={cat} className="text-xs text-gray-600">
              <span className="font-medium">{cat}:</span>{' '}
              {Object.entries(answerMap).filter(([, c]) => c === cat).map(([i]) => i).join(', ')}
            </p>
          ))}
        </div>
      )}

      {submitted && (
        <div className={cn('mb-4 p-4 rounded-xl border', correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
          <p className={cn('font-semibold mb-1', correct ? 'text-green-800' : 'text-red-800')}>
            {correct ? '✓ Perfect!' : '✗ Not quite'}
          </p>
          <p className="text-sm text-gray-600">{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleCheck}
          disabled={!allAssigned}
          className={cn(
            'w-full py-2.5 rounded-xl font-medium transition-colors',
            allAssigned ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
        >
          Check
        </button>
      )}
    </div>
  );
}

// ─── Build exercise (The Architect) ──────────────────────────────────────────

function BuildExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise;
  onResult: (correct: boolean) => void;
}) {
  const tiles = useMemo(() => (exercise.options as string[]) ?? [], [exercise.options]);
  const [built, setBuilt] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const used = new Set(built.map((_, i) => i));
  const available = tiles.filter((_, i) => !built.includes(tiles[i]) || built.filter(t => t === tiles[i]).length < tiles.filter(t => t === tiles[i]).length);

  // Track by index to handle duplicate words
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const availableTiles = tiles.map((t, i) => ({ word: t, idx: i })).filter(({ idx }) => !usedIndices.includes(idx));

  function handleAdd(word: string, idx: number) {
    if (submitted) return;
    setBuilt(prev => [...prev, word]);
    setUsedIndices(prev => [...prev, idx]);
  }

  function handleRemoveLast() {
    if (submitted || built.length === 0) return;
    setBuilt(prev => prev.slice(0, -1));
    setUsedIndices(prev => prev.slice(0, -1));
  }

  function handleCheck() {
    const userSentence = built.join(' ');
    const isCorrect = userSentence === exercise.answer;
    setCorrect(isCorrect);
    setSubmitted(true);
    onResult(isCorrect);
  }

  return (
    <div>
      {/* Construction area */}
      <div className="mb-4 min-h-14 p-3 bg-gray-900 rounded-xl border border-gray-700 flex flex-wrap gap-2 items-center">
        {built.length === 0 ? (
          <p className="text-sm text-gray-500">Click words below to build your sentence...</p>
        ) : (
          built.map((word, i) => (
            <span
              key={i}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium',
                submitted
                  ? correct ? 'bg-green-700 text-green-100' : 'bg-red-800 text-red-100'
                  : 'bg-brand-600 text-white',
              )}
            >
              {word}
            </span>
          ))
        )}
      </div>

      {/* Word tile pool */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        {availableTiles.map(({ word, idx }) => (
          <button
            key={idx}
            onClick={() => handleAdd(word, idx)}
            disabled={submitted}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-white border-gray-300 hover:border-brand-400 hover:bg-brand-50 transition-all disabled:opacity-40"
          >
            {word}
          </button>
        ))}
      </div>

      {submitted && (
        <div className={cn('mb-4 p-4 rounded-xl border', correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
          <p className={cn('font-semibold mb-1', correct ? 'text-green-800' : 'text-red-800')}>
            {correct ? '✓ Perfect structure!' : `✗ Correct: "${exercise.answer}"`}
          </p>
          <p className="text-sm text-gray-600">{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <div className="flex gap-2">
          <button
            onClick={handleRemoveLast}
            disabled={built.length === 0}
            className="px-4 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors"
          >
            ← Undo
          </button>
          <button
            onClick={handleCheck}
            disabled={availableTiles.length > 0}
            className={cn(
              'flex-1 py-2.5 rounded-xl font-medium transition-colors',
              availableTiles.length === 0 ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            )}
          >
            {availableTiles.length > 0 ? `Place ${availableTiles.length} more word${availableTiles.length > 1 ? 's' : ''}` : 'Check'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Error spot exercise (The Detective) ─────────────────────────────────────

function ErrorSpotExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise;
  onResult: (correct: boolean) => void;
}) {
  const wrongWord = ((exercise.options as string[]) ?? [])[0] ?? '';
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const parts = useMemo(() => {
    if (!wrongWord) return [{ text: exercise.question, highlight: false }];
    const idx = exercise.question.indexOf(wrongWord);
    if (idx === -1) return [{ text: exercise.question, highlight: false }];
    return [
      { text: exercise.question.slice(0, idx), highlight: false },
      { text: wrongWord, highlight: true },
      { text: exercise.question.slice(idx + wrongWord.length), highlight: false },
    ];
  }, [exercise.question, wrongWord]);

  function handleCheck() {
    const isCorrect = value.trim().toLowerCase() === exercise.answer.toLowerCase();
    setCorrect(isCorrect);
    setSubmitted(true);
    onResult(isCorrect);
  }

  return (
    <div>
      {/* Sentence with error highlighted */}
      <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
          🔍 Find the mistake
        </p>
        <p className="text-gray-900 font-medium text-base leading-relaxed">
          {parts.map((part, i) =>
            part.highlight ? (
              <span key={i} className="bg-amber-300 text-amber-900 px-1 rounded font-bold">
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
      </div>

      <p className="text-sm text-gray-500 mb-3">
        The highlighted word is wrong. Type the correct word:
      </p>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !submitted && value.trim()) handleCheck(); }}
        disabled={submitted}
        placeholder="Correct word..."
        className={cn(
          'w-full border rounded-xl px-4 py-3 text-sm mb-4 outline-none transition-colors',
          submitted
            ? correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
            : 'border-gray-300 focus:border-brand-400',
        )}
      />

      {submitted && (
        <div className={cn('mb-4 p-4 rounded-xl border', correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
          <p className={cn('font-semibold mb-1', correct ? 'text-green-800' : 'text-red-800')}>
            {correct ? '✓ Case closed!' : `✗ Answer: "${exercise.answer}"`}
          </p>
          <p className="text-sm text-gray-600">{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleCheck}
          disabled={!value.trim()}
          className={cn(
            'w-full py-2.5 rounded-xl font-medium transition-colors',
            value.trim() ? 'bg-brand-600 text-white hover:bg-brand-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
        >
          Submit
        </button>
      )}
    </div>
  );
}

// ─── Context / Picture exercise (fill-blank + multiple choice) ────────────────

function ContextExercise({
  exercise,
  onResult,
}: {
  exercise: Exercise;
  onResult: (correct: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const isMC = exercise.type === 'MULTIPLE_CHOICE';
  const options = (exercise.options as string[]) ?? [];

  const handleSubmit = useCallback(() => {
    const userAnswer = isMC ? selected ?? '' : value.trim();
    const isCorrect = userAnswer.toLowerCase() === exercise.answer.toLowerCase();
    setCorrect(isCorrect);
    setSubmitted(true);
    onResult(isCorrect);
  }, [isMC, selected, value, exercise.answer, onResult]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !submitted && value.trim()) handleSubmit();
  };

  return (
    <div>
      {exercise.imageUrl && (
        <div className="mb-5 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
          <img src={exercise.imageUrl} alt="Exercise illustration" className="w-full max-h-56 object-contain" />
        </div>
      )}

      <p className="text-gray-900 font-medium mb-5 text-base leading-relaxed">{exercise.question}</p>

      {isMC ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrectOpt = submitted && opt === exercise.answer;
            const isWrongOpt = submitted && isSelected && opt !== exercise.answer;
            return (
              <button
                key={opt}
                onClick={() => { if (!submitted) setSelected(opt); }}
                className={cn(
                  'px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all',
                  isCorrectOpt ? 'bg-green-100 border-green-400 text-green-800'
                    : isWrongOpt ? 'bg-red-100 border-red-400 text-red-800'
                    : isSelected ? 'bg-brand-50 border-brand-400 text-brand-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-brand-300',
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={submitted}
          placeholder="Type your answer..."
          className={cn(
            'w-full border rounded-xl px-4 py-3 text-sm mb-4 outline-none transition-colors',
            submitted
              ? correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
              : 'border-gray-300 focus:border-brand-400',
          )}
        />
      )}

      {submitted && (
        <div className={cn('mb-4 p-4 rounded-xl border', correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
          <p className={cn('font-semibold mb-1', correct ? 'text-green-800' : 'text-red-800')}>
            {correct ? '✓ Correct!' : `✗ Answer: ${exercise.answer}`}
          </p>
          <p className="text-sm text-gray-600">{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={isMC ? !selected : !value.trim()}
          className={cn(
            'w-full py-2.5 rounded-xl font-medium transition-colors',
            (isMC ? selected : value.trim())
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
        >
          Check
        </button>
      )}
    </div>
  );
}

// ─── Generic round runner ─────────────────────────────────────────────────────

function Round({
  exercises,
  onComplete,
  renderExercise,
}: {
  exercises: Exercise[];
  onComplete: (score: number, total: number) => void;
  renderExercise: (ex: Exercise, onResult: (correct: boolean) => void) => React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);

  const current = exercises[index];

  function handleResult(correct: boolean) {
    setResults((prev) => [...prev, correct]);
    setAnswered(true);
  }

  function handleNext() {
    if (index + 1 >= exercises.length) {
      onComplete(results.filter(Boolean).length, results.length);
    } else {
      setIndex((i) => i + 1);
      setAnswered(false);
    }
  }

  if (!current) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">{index + 1} of {exercises.length}</span>
        <div className="flex gap-1">
          {exercises.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full',
                i < results.length
                  ? results[i] ? 'bg-green-500' : 'bg-red-400'
                  : i === index ? 'bg-brand-600' : 'bg-gray-200',
              )}
            />
          ))}
        </div>
      </div>

      {renderExercise(current, handleResult)}

      {answered && (
        <button
          onClick={handleNext}
          className="mt-4 w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
        >
          {index + 1 >= exercises.length ? 'Finish Round →' : 'Next →'}
        </button>
      )}
    </div>
  );
}

// ─── Challenge session (3 phases) ────────────────────────────────────────────

const PHASE_LABELS = ['Sort', 'Context', 'Pictures'];

function ChallengeSession({
  challenge,
  onFinish,
}: {
  challenge: (typeof CHALLENGES)[number];
  onFinish: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const [scores, setScores] = useState<{ score: number; total: number }[]>([]);

  const { data: sortExercises = [], isLoading: loadingSort } = useExercises(
    { topic: challenge.slug, type: 'SORT', limit: 10 },
    true,
  );

  const { data: contextExercises = [], isLoading: loadingContext } = useExercises(
    { topics: challenge.topics as string[], limit: 10 },
    true,
  );

  const { data: pictureExercises = [], isLoading: loadingPictures } = useExercises(
    { topic: challenge.slug, type: 'FILL_BLANK', limit: 10 },
    true,
  );

  const isLoading = loadingSort || loadingContext || loadingPictures;

  // Filter to only exercises with imageUrl for picture round
  const pictureOnly = pictureExercises.filter((e) => e.imageUrl);

  const phases = [
    sortExercises.filter((e) => e.type === 'SORT'),
    contextExercises,
    pictureOnly,
  ];

  function handleRoundComplete(score: number, total: number) {
    const newScores = [...scores, { score, total }];
    setScores(newScores);

    // Skip phases with no exercises
    let nextPhase = phase + 1;
    while (nextPhase < phases.length && phases[nextPhase].length === 0) {
      nextPhase++;
    }

    if (nextPhase >= phases.length) {
      setPhase(phases.length); // done
    } else {
      setPhase(nextPhase);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Summary screen
  if (phase >= phases.length) {
    const totalScore = scores.reduce((s, r) => s + r.score, 0);
    const totalQ = scores.reduce((s, r) => s + r.total, 0);
    const pct = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0;
    return (
      <div className="text-center py-6">
        <p className="text-5xl mb-4">{pct === 100 ? '🏆' : pct >= 70 ? '🔥' : pct >= 50 ? '💪' : '📖'}</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{totalScore} / {totalQ} correct</h2>
        <p className="text-gray-500 mb-2">{pct}% accuracy across all phases</p>

        <div className="flex gap-2 justify-center mb-8">
          {scores.map((s, i) => (
            <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-center">
              <p className="text-xs text-gray-500">{PHASE_LABELS[i]}</p>
              <p className="font-bold text-gray-900">{s.score}/{s.total}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onFinish}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => { setPhase(0); setScores([]); }}
            className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const activeExercises = phases[phase];

  if (activeExercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No exercises available for this phase yet.</p>
        <button onClick={onFinish} className="text-brand-600 text-sm hover:underline">Back</button>
      </div>
    );
  }

  const activePhaseName = PHASE_LABELS[phase];

  return (
    <div>
      <PhaseIndicator phase={phase} labels={PHASE_LABELS} />
      <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-4 text-center">
        Phase {phase + 1} — {activePhaseName}
      </p>

      <Round
        key={phase}
        exercises={activeExercises}
        onComplete={handleRoundComplete}
        renderExercise={(ex, onResult) => {
          if (ex.type === 'SORT') return <SortExercise exercise={ex} onResult={onResult} />;
          if (ex.type === 'BUILD') return <BuildExercise exercise={ex} onResult={onResult} />;
          if (ex.type === 'ERROR_SPOT') return <ErrorSpotExercise exercise={ex} onResult={onResult} />;
          return <ContextExercise exercise={ex} onResult={onResult} />;
        }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChallengePage({ params }: { params: { slug: string } }) {
  const challenge = CHALLENGES.find((c) => c.slug === params.slug);
  if (!challenge) notFound();

  const { data: progress } = useProgress();
  const [started, setStarted] = useState(false);

  const topicMap = new Map(progress?.topics.map((t) => [t.topic, t]) ?? []);

  const topicStatuses = challenge.topics.map((t) => {
    const row = topicMap.get(t);
    const xp = row?.xp ?? 0;
    return { topic: t, xp, meets: xp >= challenge.minXp };
  });

  const isUnlocked = topicStatuses.every((s) => s.meets);
  const requiredRank = getRank(challenge.minXp);

  if (started && isUnlocked) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/grammar" className="hover:text-brand-600">Grammar</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{challenge.name}</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{challenge.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{challenge.name}</h1>
            <p className="text-sm text-gray-500">{challenge.description}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <ChallengeSession challenge={challenge} onFinish={() => setStarted(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/grammar" className="hover:text-brand-600">Grammar</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">Challenges</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">{challenge.emoji}</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">{challenge.name}</h1>
          <p className="text-gray-500 mt-1">{challenge.description}</p>
          <div className="flex justify-center gap-2 mt-4">
            {PHASE_LABELS.map((label, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Required — {requiredRank.emoji} {requiredRank.name} ({challenge.minXp} XP) in each topic
          </p>
          <div className="space-y-2">
            {topicStatuses.map((s) => {
              const rank = getRank(s.xp);
              return (
                <div
                  key={s.topic}
                  className={cn(
                    'flex items-center justify-between px-4 py-3 rounded-xl border',
                    s.meets ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50',
                  )}
                >
                  <span className="text-sm font-medium text-gray-800">
                    {TOPIC_LABELS[s.topic] ?? s.topic}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{rank.emoji}</span>
                    <span className={cn('text-sm font-medium', s.meets ? 'text-green-700' : 'text-gray-500')}>
                      {s.xp} XP
                    </span>
                    {s.meets
                      ? <span className="text-green-500 text-sm">✓</span>
                      : <span className="text-xs text-gray-400">{challenge.minXp - s.xp} to go</span>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isUnlocked ? (
          <button
            onClick={() => setStarted(true)}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-colors"
          >
            Start Challenge
          </button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">
              Reach {requiredRank.emoji} {requiredRank.name} in all topics above to unlock
            </p>
            <Link
              href="/grammar"
              className="inline-block px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200"
            >
              Back to Grammar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
