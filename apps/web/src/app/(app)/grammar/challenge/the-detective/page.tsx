'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@germanup/types';
import { useExercises } from '@/hooks/use-exercises';
import { useChallengeResults, useSaveChallengeResult } from '@/hooks/use-challenges';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';

// ─── Noir palette (inline only — does not touch globals) ───────────────────────
const C = {
  bg: '#0a0806',
  surface: '#12100d',
  border: '#2a2318',
  text: '#f0e8d8',
  text2: '#8a7560',
  accent: '#d4922a',
  green: '#4ade80',
  red: '#f87171',
};

// ─── Scoring / badges ──────────────────────────────────────────────────────────
function pointsForTime(timeMs: number): number {
  if (timeMs < 5000) return 100;
  if (timeMs < 10000) return 80;
  if (timeMs < 20000) return 60;
  return 40;
}

function badgeFor(score: number): string | null {
  if (score >= 920) return 'diamond';
  if (score >= 800) return 'gold';
  if (score >= 650) return 'silver';
  if (score >= 500) return 'bronze';
  return null;
}

function ratingFor(score: number): string {
  if (score >= 920) return 'Masterful';
  if (score >= 800) return 'Sharp eye';
  if (score >= 650) return 'Solid work';
  if (score >= 500) return 'On the trail';
  return 'Case unsolved';
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTime(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const clean = (w: string) => w.replace(/[.,!?;:]/g, '').toLowerCase();

// ─── A single interrogation (one sentence) ─────────────────────────────────────
function DetectiveQuestion({
  exercise,
  onAnswered,
}: {
  exercise: Exercise;
  onAnswered: (points: number) => void;
}) {
  const words = useMemo(() => exercise.question.split(' ').filter(Boolean), [exercise.question]);
  const wrongWordClean = clean((exercise.options as string[] | null)?.[0] ?? '');

  const startRef = useRef(Date.now());
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleClick(i: number) {
    if (submitted) return;
    const isCorrect = clean(words[i]) === wrongWordClean;
    const points = isCorrect ? pointsForTime(Date.now() - startRef.current) : 0;
    setClickedIdx(i);
    setSubmitted(true);
    window.setTimeout(() => onAnswered(points), 500);
  }

  return (
    <p style={{ fontSize: 18, lineHeight: 1.7, color: C.text }}>
      {words.map((word, i) => {
        const isTarget = clean(word) === wrongWordClean;
        let style: React.CSSProperties = { cursor: submitted ? 'default' : 'pointer', borderRadius: 4, padding: '0 2px' };
        if (submitted && isTarget) {
          style = { ...style, background: 'rgba(74,222,128,0.18)', color: C.green };
        } else if (submitted && i === clickedIdx && !isTarget) {
          style = { ...style, background: 'rgba(248,113,113,0.18)', color: C.red };
        }
        return (
          <span key={i}>
            {i > 0 && ' '}
            <span
              onClick={() => handleClick(i)}
              style={style}
              className={submitted ? undefined : 'detective-word'}
            >
              {word}
            </span>
          </span>
        );
      })}
    </p>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TheDetectivePage() {
  const { data: exercises = [], isLoading, refetch } = useExercises(
    { topic: 'the-detective', type: 'ERROR_SPOT', limit: 10 },
    true,
  );
  const { data: results } = useChallengeResults();
  const saveResult = useSaveChallengeResult();

  const total = exercises.length;

  const [phase, setPhase] = useState<'playing' | 'done'>('playing');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const pageStart = useRef(Date.now());
  const savedRef = useRef(false);

  // Mirror the latest personal best so we can snapshot it the moment a run ends
  // (before saving invalidates the results query).
  const bestRef = useRef<number | null>(null);
  bestRef.current = results?.find((r) => r.challengeSlug === 'the-detective')?.bestScore ?? null;

  // Save once when a run finishes.
  useEffect(() => {
    if (phase === 'done' && !savedRef.current) {
      savedRef.current = true;
      saveResult.mutate({ challengeSlug: 'the-detective', score: finalScore });
    }
  }, [phase, finalScore, saveResult]);

  function handleAnswered(points: number) {
    const newScore = score + points;
    setScore(newScore);
    if (index + 1 >= total) {
      setFinalScore(newScore);
      setElapsedMs(Date.now() - pageStart.current);
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
    setElapsedMs(0);
    setPrevBest(null);
    pageStart.current = Date.now();
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
      <style>{`.detective-word:hover { text-decoration: underline; text-decoration-color: ${C.accent}; }`}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2" style={{ color: C.accent }}>
          <ChallengeIcon slug="the-detective" size={16} color={C.accent} />
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
            The Detective
          </span>
        </div>
        {phase === 'playing' && total > 0 && (
          <span style={{ fontSize: 12, color: C.text2 }}>
            Case {index + 1} / {total}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <div
            className="w-8 h-8 border-4 rounded-full animate-spin"
            style={{ borderColor: C.border, borderTopColor: C.accent }}
          />
        </div>
      )}

      {/* No data */}
      {!isLoading && total === 0 && (
        <div className="text-center py-12">
          <p style={{ color: C.text2, marginBottom: 16 }}>No cases on file yet. Check back soon.</p>
          <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>
            ← Back to Challenges
          </Link>
        </div>
      )}

      {/* Playing */}
      {!isLoading && total > 0 && phase === 'playing' && (
        <div>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.text2, marginBottom: 16 }}>
            One word is wrong. Click it.
          </p>
          <DetectiveQuestion key={index} exercise={exercises[index]} onAnswered={handleAnswered} />
        </div>
      )}

      {/* Results */}
      {phase === 'done' && (
        <div className="text-center py-4">
          <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>
            {ratingFor(finalScore)}
          </p>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>
            {finalScore}
            <span style={{ fontSize: 20, color: C.text2 }}> / 1000</span>
          </h2>

          <div className="flex items-center justify-center gap-3 mt-4 mb-2">
            <span
              style={{
                background: badge ? 'rgba(212,146,42,0.15)' : C.surface,
                color: badge ? C.accent : C.text2,
                border: `1px solid ${badge ? 'rgba(212,146,42,0.4)' : C.border}`,
                fontSize: 13,
                fontWeight: 700,
                padding: '5px 14px',
                borderRadius: 99,
              }}
            >
              {badge ? cap(badge) : 'No badge'}
            </span>
            <span style={{ fontSize: 13, color: C.text2 }}>Solved in {formatTime(elapsedMs)}</span>
          </div>

          {isNewBest && finalScore > 0 && (
            <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginTop: 6 }}>New personal best!</p>
          )}

          <div className="flex gap-3 justify-center mt-8">
            <Link
              href="/grammar/challenges"
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 14,
                background: C.surface,
                color: C.text2,
                border: `1px solid ${C.border}`,
                textDecoration: 'none',
              }}
            >
              Back to Challenges
            </Link>
            <button
              onClick={playAgain}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                background: C.accent,
                color: '#111',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
