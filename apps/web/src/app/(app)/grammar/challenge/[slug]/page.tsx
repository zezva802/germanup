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

function PhaseIndicator({ phase, labels }: { phase: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {labels.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors"
              style={
                i < phase
                  ? { background: 'var(--green)', color: 'var(--bg)' }
                  : i === phase
                  ? { background: 'var(--accent)', color: '#111' }
                  : { background: 'var(--s3)', color: 'var(--text3)' }
              }
            >
              {i < phase ? '✓' : i + 1}
            </div>
            <p className="text-xs mt-1 font-medium" style={{ color: i === phase ? 'var(--accent)' : 'var(--text3)' }}>
              {label}
            </p>
          </div>
          {i < labels.length - 1 && (
            <div
              className="h-0.5 w-10 mx-2 mb-4 transition-colors"
              style={{ background: i < phase ? 'var(--green)' : 'var(--line2)' }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Sort exercise ────────────────────────────────────────────────────────────

function SortExercise({ exercise, onResult }: { exercise: Exercise; onResult: (correct: boolean) => void }) {
  const answerMap = useMemo(() => JSON.parse(exercise.answer) as Record<string, string>, [exercise.answer]);
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
    setAssignments((prev) => { const next = { ...prev }; delete next[item]; return next; });
    setSelected(item);
  }

  function handleCheck() {
    const isCorrect = Object.entries(assignments).every(([item, cat]) => answerMap[item] === cat);
    setCorrect(isCorrect);
    setSubmitted(true);
    onResult(isCorrect);
  }

  return (
    <div>
      {/* Unassigned pool */}
      <div
        className="flex flex-wrap gap-2 min-h-14 p-3 mb-5 rounded-xl border border-dashed"
        style={{ background: 'var(--s2)', borderColor: 'var(--line2)' }}
      >
        {unassigned.length === 0 ? (
          <p className="text-sm self-center w-full text-center" style={{ color: 'var(--text3)' }}>
            All placed — check your answers
          </p>
        ) : (
          unassigned.map((item) => (
            <button
              key={item}
              onClick={() => handleItemClick(item)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
              style={
                selected === item
                  ? { background: 'var(--accent)', color: '#111', borderColor: 'var(--accent)' }
                  : { background: 'var(--s3)', color: 'var(--text)', borderColor: 'var(--line2)' }
              }
            >
              {item}
            </button>
          ))
        )}
      </div>

      {/* Category buckets */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
        {categories.map((category) => {
          const itemsInBucket = Object.entries(assignments).filter(([, cat]) => cat === category).map(([item]) => item);
          return (
            <div
              key={category}
              onClick={() => handleCategoryClick(category)}
              className="min-h-28 p-3 rounded-xl border-2 transition-all"
              style={{
                background: 'var(--s2)',
                borderColor: submitted ? 'var(--line)' : selected ? 'var(--accent-dim)' : 'var(--line)',
                cursor: submitted ? 'default' : selected ? 'pointer' : 'default',
              }}
            >
              <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text3)' }}>
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
                      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
                      style={
                        isRight
                          ? { background: 'rgba(74,222,128,0.15)', color: 'var(--green)', borderColor: 'rgba(74,222,128,0.3)', cursor: 'default' }
                          : isWrong
                          ? { background: 'rgba(248,113,113,0.15)', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', cursor: 'default' }
                          : { background: 'var(--s3)', color: 'var(--text)', borderColor: 'var(--line2)' }
                      }
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
        <div className="mb-4 p-3 rounded-xl border" style={{ background: 'var(--s2)', borderColor: 'var(--line2)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text2)' }}>Correct answers:</p>
          {categories.map((cat) => (
            <p key={cat} className="text-xs" style={{ color: 'var(--text2)' }}>
              <span className="font-medium" style={{ color: 'var(--text)' }}>{cat}:</span>{' '}
              {Object.entries(answerMap).filter(([, c]) => c === cat).map(([i]) => i).join(', ')}
            </p>
          ))}
        </div>
      )}

      {submitted && (
        <div
          className="mb-4 p-4 rounded-xl border"
          style={
            correct
              ? { background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }
              : { background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.25)' }
          }
        >
          <p className="font-semibold mb-1" style={{ color: correct ? 'var(--green)' : '#f87171' }}>
            {correct ? '✓ Perfect!' : '✗ Not quite'}
          </p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleCheck}
          disabled={!allAssigned}
          className="w-full py-2.5 rounded-xl font-medium transition-opacity hover:opacity-85 disabled:opacity-30"
          style={{ background: 'var(--accent)', color: '#111' }}
        >
          Check
        </button>
      )}
    </div>
  );
}

// ─── Build exercise ───────────────────────────────────────────────────────────

function BuildExercise({ exercise, onResult }: { exercise: Exercise; onResult: (correct: boolean) => void }) {
  const tiles = useMemo(() => (exercise.options as string[]) ?? [], [exercise.options]);
  const [built, setBuilt] = useState<string[]>([]);
  const [usedIndices, setUsedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const availableTiles = tiles.map((t, i) => ({ word: t, idx: i })).filter(({ idx }) => !usedIndices.includes(idx));

  function handleAdd(word: string, idx: number) {
    if (submitted) return;
    setBuilt((prev) => [...prev, word]);
    setUsedIndices((prev) => [...prev, idx]);
  }

  function handleRemoveLast() {
    if (submitted || built.length === 0) return;
    setBuilt((prev) => prev.slice(0, -1));
    setUsedIndices((prev) => prev.slice(0, -1));
  }

  function handleCheck() {
    const isCorrect = built.join(' ') === exercise.answer;
    setCorrect(isCorrect);
    setSubmitted(true);
    onResult(isCorrect);
  }

  return (
    <div>
      {/* Construction area */}
      <div
        className="mb-4 min-h-14 p-3 rounded-xl border flex flex-wrap gap-2 items-center"
        style={{ background: 'var(--s1)', borderColor: 'var(--line2)' }}
      >
        {built.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text3)' }}>Click words below to build your sentence…</p>
        ) : (
          built.map((word, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-lg text-sm font-medium"
              style={
                submitted
                  ? correct
                    ? { background: 'rgba(74,222,128,0.15)', color: 'var(--green)' }
                    : { background: 'rgba(248,113,113,0.15)', color: '#f87171' }
                  : { background: 'var(--accent)', color: '#111' }
              }
            >
              {word}
            </span>
          ))
        )}
      </div>

      {/* Tile pool */}
      <div
        className="flex flex-wrap gap-2 mb-4 p-3 rounded-xl border border-dashed"
        style={{ background: 'var(--s2)', borderColor: 'var(--line2)' }}
      >
        {availableTiles.map(({ word, idx }) => (
          <button
            key={idx}
            onClick={() => handleAdd(word, idx)}
            disabled={submitted}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all hover:opacity-80 disabled:opacity-30"
            style={{ background: 'var(--s3)', color: 'var(--text)', borderColor: 'var(--line2)' }}
          >
            {word}
          </button>
        ))}
      </div>

      {submitted && (
        <div
          className="mb-4 p-4 rounded-xl border"
          style={
            correct
              ? { background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }
              : { background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.25)' }
          }
        >
          <p className="font-semibold mb-1" style={{ color: correct ? 'var(--green)' : '#f87171' }}>
            {correct ? '✓ Perfect structure!' : `✗ Correct: "${exercise.answer}"`}
          </p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <div className="flex gap-2">
          <button
            onClick={handleRemoveLast}
            disabled={built.length === 0}
            className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-30 transition-opacity hover:opacity-80"
            style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
          >
            ← Undo
          </button>
          <button
            onClick={handleCheck}
            disabled={availableTiles.length > 0}
            className="flex-1 py-2.5 rounded-xl font-medium transition-opacity hover:opacity-85 disabled:opacity-30"
            style={{ background: 'var(--accent)', color: '#111' }}
          >
            {availableTiles.length > 0 ? `Place ${availableTiles.length} more word${availableTiles.length > 1 ? 's' : ''}` : 'Check'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Error spot exercise ──────────────────────────────────────────────────────

function ErrorSpotExercise({ exercise, onResult }: { exercise: Exercise; onResult: (correct: boolean) => void }) {
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
      <div className="mb-5 p-4 rounded-xl border" style={{ background: 'rgba(251,178,36,0.06)', borderColor: 'rgba(251,178,36,0.25)' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--amber)' }}>
          🔍 Find the mistake
        </p>
        <p className="font-medium text-base leading-relaxed" style={{ color: 'var(--text)' }}>
          {parts.map((part, i) =>
            part.highlight ? (
              <span key={i} className="px-1 rounded font-bold" style={{ background: 'rgba(251,178,36,0.3)', color: 'var(--amber)' }}>
                {part.text}
              </span>
            ) : (
              <span key={i}>{part.text}</span>
            ),
          )}
        </p>
      </div>

      <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>
        The highlighted word is wrong. Type the correct word:
      </p>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !submitted && value.trim()) handleCheck(); }}
        disabled={submitted}
        placeholder="Correct word…"
        className="w-full border rounded-xl px-4 py-3 text-sm mb-4 outline-none transition-colors"
        style={{
          background: 'var(--s1)',
          color: 'var(--text)',
          borderColor: submitted ? (correct ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)') : 'var(--line2)',
        }}
      />

      {submitted && (
        <div
          className="mb-4 p-4 rounded-xl border"
          style={
            correct
              ? { background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }
              : { background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.25)' }
          }
        >
          <p className="font-semibold mb-1" style={{ color: correct ? 'var(--green)' : '#f87171' }}>
            {correct ? '✓ Case closed!' : `✗ Answer: "${exercise.answer}"`}
          </p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleCheck}
          disabled={!value.trim()}
          className="w-full py-2.5 rounded-xl font-medium transition-opacity hover:opacity-85 disabled:opacity-30"
          style={{ background: 'var(--accent)', color: '#111' }}
        >
          Submit
        </button>
      )}
    </div>
  );
}

// ─── Context / fill-blank / multiple choice ───────────────────────────────────

function ContextExercise({ exercise, onResult }: { exercise: Exercise; onResult: (correct: boolean) => void }) {
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

  return (
    <div>
      {exercise.imageUrl && (
        <div className="mb-5 rounded-xl overflow-hidden border" style={{ background: 'var(--s2)', borderColor: 'var(--line)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={exercise.imageUrl} alt="" className="w-full max-h-56 object-contain" />
        </div>
      )}

      <p className="font-medium mb-5 text-base leading-relaxed" style={{ color: 'var(--text)' }}>{exercise.question}</p>

      {isMC ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {options.map((opt) => {
            const isSelected   = selected === opt;
            const isCorrectOpt = submitted && opt === exercise.answer;
            const isWrongOpt   = submitted && isSelected && opt !== exercise.answer;
            return (
              <button
                key={opt}
                onClick={() => { if (!submitted) setSelected(opt); }}
                className="px-4 py-3 rounded-xl border text-sm font-medium text-left transition-all"
                style={
                  isCorrectOpt ? { background: 'rgba(74,222,128,0.12)', borderColor: 'rgba(74,222,128,0.35)', color: 'var(--green)' }
                  : isWrongOpt ? { background: 'rgba(248,113,113,0.12)', borderColor: 'rgba(248,113,113,0.35)', color: '#f87171' }
                  : isSelected ? { background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--text)' }
                  : { background: 'var(--s2)', borderColor: 'var(--line)', color: 'var(--text2)' }
                }
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
          onKeyDown={(e) => { if (e.key === 'Enter' && !submitted && value.trim()) handleSubmit(); }}
          disabled={submitted}
          placeholder="Type your answer…"
          className="w-full border rounded-xl px-4 py-3 text-sm mb-4 outline-none transition-colors"
          style={{
            background: 'var(--s1)',
            color: 'var(--text)',
            borderColor: submitted ? (correct ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)') : 'var(--line2)',
          }}
        />
      )}

      {submitted && (
        <div
          className="mb-4 p-4 rounded-xl border"
          style={
            correct
              ? { background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }
              : { background: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.25)' }
          }
        >
          <p className="font-semibold mb-1" style={{ color: correct ? 'var(--green)' : '#f87171' }}>
            {correct ? '✓ Correct!' : `✗ Answer: ${exercise.answer}`}
          </p>
          <p className="text-sm" style={{ color: 'var(--text2)' }}>{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={isMC ? !selected : !value.trim()}
          className="w-full py-2.5 rounded-xl font-medium transition-opacity hover:opacity-85 disabled:opacity-30"
          style={{ background: 'var(--accent)', color: '#111' }}
        >
          Check
        </button>
      )}
    </div>
  );
}

// ─── Round runner ─────────────────────────────────────────────────────────────

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
        <span className="text-xs" style={{ color: 'var(--text3)' }}>{index + 1} of {exercises.length}</span>
        <div className="flex gap-1">
          {exercises.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                background: i < results.length
                  ? results[i] ? 'var(--green)' : '#f87171'
                  : i === index ? 'var(--accent)' : 'var(--s3)',
              }}
            />
          ))}
        </div>
      </div>

      {renderExercise(current, handleResult)}

      {answered && (
        <button
          onClick={handleNext}
          className="mt-4 w-full py-2.5 rounded-xl font-medium transition-opacity hover:opacity-85"
          style={{ background: 'var(--s3)', color: 'var(--text)', border: '1px solid var(--line2)' }}
        >
          {index + 1 >= exercises.length ? 'Finish Round →' : 'Next →'}
        </button>
      )}
    </div>
  );
}

// ─── Challenge session ────────────────────────────────────────────────────────

const PHASE_LABELS = ['Sort', 'Context', 'Pictures'];

function ChallengeSession({ challenge, onFinish }: { challenge: (typeof CHALLENGES)[number]; onFinish: () => void }) {
  const [phase, setPhase] = useState(0);
  const [scores, setScores] = useState<{ score: number; total: number }[]>([]);

  const { data: sortExercises = [], isLoading: loadingSort } = useExercises(
    { topic: challenge.slug, type: 'SORT', limit: 10 }, true,
  );
  const { data: contextExercises = [], isLoading: loadingContext } = useExercises(
    { topics: challenge.topics as string[], limit: 10 }, true,
  );
  const { data: pictureExercises = [], isLoading: loadingPictures } = useExercises(
    { topic: challenge.slug, type: 'FILL_BLANK', limit: 10 }, true,
  );

  const isLoading = loadingSort || loadingContext || loadingPictures;
  const pictureOnly = pictureExercises.filter((e) => e.imageUrl);
  const phases = [sortExercises.filter((e) => e.type === 'SORT'), contextExercises, pictureOnly];

  function handleRoundComplete(score: number, total: number) {
    const newScores = [...scores, { score, total }];
    setScores(newScores);
    let nextPhase = phase + 1;
    while (nextPhase < phases.length && phases[nextPhase].length === 0) nextPhase++;
    setPhase(nextPhase >= phases.length ? phases.length : nextPhase);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: 'var(--line2)', borderTopColor: 'var(--accent)' }}
        />
      </div>
    );
  }

  if (phase >= phases.length) {
    const totalScore = scores.reduce((s, r) => s + r.score, 0);
    const totalQ     = scores.reduce((s, r) => s + r.total, 0);
    const pct        = totalQ > 0 ? Math.round((totalScore / totalQ) * 100) : 0;
    return (
      <div className="text-center py-6">
        <p className="text-5xl mb-4">{pct === 100 ? '🏆' : pct >= 70 ? '🔥' : pct >= 50 ? '💪' : '📖'}</p>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>{totalScore} / {totalQ} correct</h2>
        <p className="mb-2" style={{ color: 'var(--text2)' }}>{pct}% accuracy across all phases</p>

        <div className="flex gap-2 justify-center mb-8">
          {scores.map((s, i) => (
            <div key={i} className="rounded-xl px-4 py-2 text-center border" style={{ background: 'var(--s2)', borderColor: 'var(--line)' }}>
              <p className="text-xs" style={{ color: 'var(--text3)' }}>{PHASE_LABELS[i]}</p>
              <p className="font-bold" style={{ color: 'var(--text)' }}>{s.score}/{s.total}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onFinish}
            className="px-6 py-2.5 rounded-xl font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
          >
            Back
          </button>
          <button
            onClick={() => { setPhase(0); setScores([]); }}
            className="px-6 py-2.5 rounded-xl font-medium transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)', color: '#111' }}
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
        <p className="mb-4" style={{ color: 'var(--text2)' }}>No exercises available for this phase yet.</p>
        <button
          onClick={onFinish}
          className="text-sm transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <PhaseIndicator phase={phase} labels={PHASE_LABELS} />
      <p className="text-xs font-semibold uppercase tracking-wide mb-4 text-center" style={{ color: 'var(--accent)' }}>
        Phase {phase + 1} — {PHASE_LABELS[phase]}
      </p>
      <Round
        key={phase}
        exercises={activeExercises}
        onComplete={handleRoundComplete}
        renderExercise={(ex, onResult) => {
          if (ex.type === 'SORT')       return <SortExercise exercise={ex} onResult={onResult} />;
          if (ex.type === 'BUILD')      return <BuildExercise exercise={ex} onResult={onResult} />;
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
    return { topic: t, xp: row?.xp ?? 0, meets: (row?.xp ?? 0) >= challenge.minXp };
  });
  const isUnlocked   = topicStatuses.every((s) => s.meets);
  const requiredRank = getRank(challenge.minXp);

  if (started && isUnlocked) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text3)' }}>
          <Link href="/grammar/challenges" className="transition-opacity hover:opacity-70" style={{ color: 'var(--text2)' }}>
            Challenges
          </Link>
          <span>/</span>
          <span style={{ color: 'var(--text)' }}>{challenge.name}</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{challenge.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{challenge.name}</h1>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>{challenge.description}</p>
          </div>
        </div>
        <div className="rounded-2xl p-6 border" style={{ background: 'var(--s1)', borderColor: 'var(--line)' }}>
          <ChallengeSession challenge={challenge} onFinish={() => setStarted(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-2 text-sm mb-6" style={{ color: 'var(--text3)' }}>
        <Link href="/grammar/challenges" className="transition-opacity hover:opacity-70" style={{ color: 'var(--text2)' }}>
          Challenges
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--text)' }}>{challenge.name}</span>
      </div>

      <div className="rounded-2xl p-8 border" style={{ background: 'var(--s1)', borderColor: 'var(--line)' }}>
        <div className="text-center mb-8">
          <span className="text-5xl">{challenge.emoji}</span>
          <h1 className="text-2xl font-bold mt-3" style={{ color: 'var(--text)' }}>{challenge.name}</h1>
          <p className="mt-1" style={{ color: 'var(--text2)' }}>{challenge.description}</p>
          <div className="flex justify-center gap-2 mt-4">
            {PHASE_LABELS.map((label, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'var(--s3)', color: 'var(--text2)' }}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text3)' }}>
            Required — {requiredRank.emoji} {requiredRank.name} ({challenge.minXp} XP) in each topic
          </p>
          <div className="space-y-2">
            {topicStatuses.map((s) => {
              const rank = getRank(s.xp);
              return (
                <div
                  key={s.topic}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border"
                  style={
                    s.meets
                      ? { borderColor: 'rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.06)' }
                      : { borderColor: 'var(--line)', background: 'var(--s2)' }
                  }
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {TOPIC_LABELS[s.topic] ?? s.topic}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{rank.emoji}</span>
                    <span className="text-sm font-medium" style={{ color: s.meets ? 'var(--green)' : 'var(--text2)' }}>
                      {s.xp} XP
                    </span>
                    {s.meets
                      ? <span style={{ color: 'var(--green)', fontSize: 14 }}>✓</span>
                      : <span className="text-xs" style={{ color: 'var(--text3)' }}>{challenge.minXp - s.xp} to go</span>
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
            className="w-full py-3 rounded-xl font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)', color: '#111' }}
          >
            Start Challenge
          </button>
        ) : (
          <div className="text-center">
            <p className="text-sm mb-3" style={{ color: 'var(--text2)' }}>
              Reach {requiredRank.emoji} {requiredRank.name} in all topics above to unlock
            </p>
            <Link
              href="/grammar/challenges"
              className="inline-block px-6 py-2.5 rounded-xl font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
            >
              Back to Challenges
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
