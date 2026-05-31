'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@germanup/types';
import { useExercises } from '@/hooks/use-exercises';
import { useChallengeResults, useSaveChallengeResult } from '@/hooks/use-challenges';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';
import { ResultMark } from '@/components/challenges/result-mark';
import { badgeFor, badgeLabel } from '@/lib/challenge-scoring';

// ─── Forged-document palette (inline only) ─────────────────────────────────────
const C = {
  bg: '#0d0b09',
  surface: '#161310',
  border: '#2e2820',
  text: '#ede8de',
  text2: '#7a6e60',
  english: '#5a9a6a',
  accent: '#c8a84b',
  inputBorder: '#3a3228',
  green: '#4ade80',
  red: '#f87171',
};
const MONO = "'Courier New', Courier, monospace";

function ratingFor(score: number): string {
  if (score >= 920) return 'Flawless forgery';
  if (score >= 800) return 'Convincing';
  if (score >= 650) return 'Passable';
  if (score >= 500) return 'Smudged ink';
  return 'Detected';
}

function pointsForTime(timeMs: number): number {
  if (timeMs < 8000) return 100;
  if (timeMs < 15000) return 80;
  if (timeMs < 25000) return 60;
  return 40;
}

const norm = (s: string) => s.trim().toLowerCase();

interface ForgerRecord {
  english: string;
  question: string;
  typed: string[];
  expected: string[];
  correct: boolean;
  timeMs: number;
}

// ─── One document (one fill-blank sentence) ────────────────────────────────────
function ForgerQuestion({
  exercise,
  onAnswered,
}: {
  exercise: Exercise;
  onAnswered: (rec: ForgerRecord) => void;
}) {
  const english = (exercise.options as string[] | null)?.[0] ?? '';
  const parts = useMemo(() => exercise.question.split('___'), [exercise.question]);
  const blankCount = Math.max(1, parts.length - 1);
  const expected = useMemo(
    () => (exercise.answer.includes('...') ? exercise.answer.split('...').map((s) => s.trim()) : [exercise.answer]),
    [exercise.answer],
  );

  const startRef = useRef(Date.now());
  const [values, setValues] = useState<string[]>(Array(blankCount).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  function setValue(i: number, v: string) {
    setValues((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  }

  function checkCorrect(): boolean {
    if (expected.length === blankCount) {
      return values.every((v, i) => norm(v) === norm(expected[i]));
    }
    // Fallback when blank count and answer-part count disagree.
    return norm(values.join(' ')) === norm(exercise.answer.replace(/\.\.\./g, ' '));
  }

  function submit() {
    if (submitted || values.some((v) => !v.trim())) return;
    const isCorrect = checkCorrect();
    setCorrect(isCorrect);
    setSubmitted(true);
    const rec: ForgerRecord = {
      english,
      question: exercise.question,
      typed: values,
      expected,
      correct: isCorrect,
      timeMs: Date.now() - startRef.current,
    };
    window.setTimeout(() => onAnswered(rec), 1200);
  }

  const borderColor = submitted ? (correct ? C.green : C.red) : C.inputBorder;

  return (
    <div>
      {english && (
        <p style={{ color: C.english, fontStyle: 'italic', fontSize: 15, marginBottom: 18 }}>{english}</p>
      )}

      <p style={{ fontFamily: MONO, fontSize: 18, lineHeight: 1.9, color: C.text }}>
        {parts.map((part, i) => (
          <span key={i}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <input
                autoFocus={i === 0}
                value={values[i]}
                onChange={(e) => setValue(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
                disabled={submitted}
                spellCheck={false}
                autoComplete="off"
                style={{
                  fontFamily: MONO,
                  fontSize: 18,
                  width: 'min(180px, 20ch)',
                  background: 'transparent',
                  color: submitted ? (correct ? C.green : C.red) : C.accent,
                  border: 'none',
                  borderBottom: `2px solid ${borderColor}`,
                  outline: 'none',
                  textAlign: 'center',
                  margin: '0 4px',
                }}
              />
            )}
          </span>
        ))}
      </p>

      {submitted && (
        <div className="flex items-start gap-2 mt-6">
          <ResultMark ok={correct} okColor={C.green} failColor={C.red} size={16} />
          <div>
            {!correct && (
              <p style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>
                Correct: <span style={{ color: C.accent, fontFamily: MONO, fontWeight: 700 }}>{expected.join(' … ')}</span>
              </p>
            )}
            <p style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>{exercise.explanation}</p>
          </div>
        </div>
      )}

      {!submitted && (
        <p style={{ fontSize: 12, color: C.text2, marginTop: 20 }}>Press Enter to forge</p>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TheForgerPage() {
  const { data: exercises = [], isLoading, refetch } = useExercises(
    { topic: 'the-forger', type: 'FILL_BLANK', limit: 10 },
    true,
  );
  const { data: results } = useChallengeResults();
  const saveResult = useSaveChallengeResult();

  const total = exercises.length;

  const [phase, setPhase] = useState<'playing' | 'done'>('playing');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [records, setRecords] = useState<ForgerRecord[]>([]);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const savedRef = useRef(false);
  const bestRef = useRef<number | null>(null);
  bestRef.current = results?.find((r) => r.challengeSlug === 'the-forger')?.bestScore ?? null;

  useEffect(() => {
    if (phase === 'done' && !savedRef.current) {
      savedRef.current = true;
      saveResult.mutate({ challengeSlug: 'the-forger', score: finalScore });
    }
  }, [phase, finalScore, saveResult]);

  function handleAnswered(rec: ForgerRecord) {
    const points = rec.correct ? pointsForTime(rec.timeMs) : 0;
    const newScore = score + points;
    setScore(newScore);
    setRecords((prev) => [...prev, rec]);
    if (index + 1 >= total) {
      setFinalScore(newScore);
      setPrevBest(bestRef.current);
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
    }
  }

  function playAgain() {
    savedRef.current = false;
    setScore(0);
    setFinalScore(0);
    setIndex(0);
    setRecords([]);
    setPrevBest(null);
    setPhase('playing');
    refetch();
  }

  const badge = badgeFor(finalScore);
  const isNewBest = phase === 'done' && (prevBest === null || finalScore > prevBest);

  return (
    <div
      style={{
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        padding: 28,
        maxWidth: 640,
        minHeight: 420,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2" style={{ color: C.accent }}>
          <ChallengeIcon slug="the-forger" size={16} color={C.accent} />
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
            The Forger
          </span>
        </div>
        {phase === 'playing' && total > 0 && (
          <span style={{ fontSize: 12, color: C.text2 }}>Document {index + 1} / {total}</span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.accent }} />
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="text-center py-12">
          <p style={{ color: C.text2, marginBottom: 16 }}>No documents to forge yet. Check back soon.</p>
          <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>
            ← Back to Challenges
          </Link>
        </div>
      )}

      {!isLoading && total > 0 && phase === 'playing' && (
        <ForgerQuestion key={index} exercise={exercises[index]} onAnswered={handleAnswered} />
      )}

      {phase === 'done' && (
        <div>
          <div className="text-center mb-6">
            <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>
              {ratingFor(finalScore)}
            </p>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>
              {finalScore}
              <span style={{ fontSize: 20, color: C.text2 }}> / 1000</span>
            </h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span
                style={{
                  background: badge ? 'rgba(200,168,75,0.15)' : C.surface,
                  color: badge ? C.accent : C.text2,
                  border: `1px solid ${badge ? 'rgba(200,168,75,0.4)' : C.border}`,
                  fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 99,
                }}
              >
                {badgeLabel(badge)}
              </span>
              <span style={{ fontSize: 13, color: C.text2 }}>
                {records.filter((r) => r.correct).length}/{total} forged
              </span>
            </div>
            {isNewBest && finalScore > 0 && (
              <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginTop: 6 }}>New personal best!</p>
            )}
          </div>

          {/* Breakdown */}
          <div className="rounded-lg mb-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {records.map((r, i) => (
              <div
                key={i}
                className="flex items-start gap-2 px-3 py-2.5"
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.border}`, fontSize: 13 }}
              >
                <div className="mt-0.5"><ResultMark ok={r.correct} okColor={C.green} failColor={C.red} /></div>
                <div className="min-w-0 flex-1">
                  <p style={{ fontFamily: MONO, color: C.text }}>{r.question.replace(/___/g, '____')}</p>
                  <p style={{ color: C.text2, marginTop: 2 }}>
                    {r.correct ? (
                      <span style={{ color: C.green }}>{r.expected.join(' … ')}</span>
                    ) : (
                      <>
                        you: <span style={{ color: C.red }}>{r.typed.join(' … ') || '—'}</span>
                        {' → '}
                        <span style={{ color: C.accent }}>{r.expected.join(' … ')}</span>
                      </>
                    )}
                    <span style={{ marginLeft: 8, color: C.text2 }}>· {(r.timeMs / 1000).toFixed(1)}s</span>
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/grammar/challenges"
              style={{
                padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                background: C.surface, color: C.text2, border: `1px solid ${C.border}`, textDecoration: 'none',
              }}
            >
              Back to Challenges
            </Link>
            <button
              onClick={playAgain}
              style={{
                padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                background: C.accent, color: '#111', border: 'none', cursor: 'pointer',
              }}
            >
              Forge Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
