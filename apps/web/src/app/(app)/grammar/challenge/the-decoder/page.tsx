'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@germanup/types';
import { useExercises } from '@/hooks/use-exercises';
import { useChallengeResults, useSaveChallengeResult } from '@/hooks/use-challenges';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';
import { ResultMark } from '@/components/challenges/result-mark';
import { badgeFor, badgeLabel } from '@/lib/challenge-scoring';

// ─── Broken-transmission palette (inline only) ─────────────────────────────────
const C = {
  bg: '#080a12',
  surface: '#0e1220',
  border: '#1c2440',
  tile: '#1c2440',
  tileBorder: '#2a3860',
  text: '#c8d8f0',
  muted: '#4a5880',
  accent: '#60a5fa',
  green: '#4ade80',
  red: '#f87171',
};

function ratingFor(score: number): string {
  if (score >= 920) return 'Signal clear';
  if (score >= 800) return 'Decoded';
  if (score >= 650) return 'Mostly legible';
  if (score >= 500) return 'Static';
  return 'Lost in noise';
}

function pointsForTime(timeMs: number): number {
  if (timeMs < 12000) return 100;
  if (timeMs < 22000) return 80;
  if (timeMs < 35000) return 60;
  return 40;
}

interface DecoderRecord {
  english: string;
  built: string;
  answer: string;
  correct: boolean;
}

interface Tile {
  word: string;
  key: number;
}

// ─── One transmission ──────────────────────────────────────────────────────────
function DecoderQuestion({
  exercise,
  onAnswered,
}: {
  exercise: Exercise;
  onAnswered: (rec: DecoderRecord, points: number) => void;
}) {
  // Shuffle the tiles once when the question mounts.
  const [tiles] = useState<Tile[]>(() => {
    const opts = (exercise.options as string[] | null) ?? [];
    return [...opts]
      .sort(() => Math.random() - 0.5)
      .map((word, key) => ({ word, key }));
  });

  const startRef = useRef(Date.now());
  const [placed, setPlaced] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const placedSet = new Set(placed);
  const pool = tiles.filter((t) => !placedSet.has(t.key));
  const built = placed.map((k) => tiles[k].word).join(' ');

  function placeTile(key: number) {
    if (submitted) return;
    setPlaced((prev) => [...prev, key]);
  }
  function removeTile(key: number) {
    if (submitted) return;
    setPlaced((prev) => prev.filter((k) => k !== key));
  }
  function undo() {
    if (submitted) return;
    setPlaced((prev) => prev.slice(0, -1));
  }

  function decode() {
    if (submitted) return;
    const isCorrect = built === exercise.answer;
    setCorrect(isCorrect);
    setSubmitted(true);
    const points = isCorrect ? pointsForTime(Date.now() - startRef.current) : 0;
    const rec: DecoderRecord = {
      english: exercise.question,
      built,
      answer: exercise.answer,
      correct: isCorrect,
    };
    window.setTimeout(() => onAnswered(rec, points), 1500);
  }

  return (
    <div>
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 18 }}>
        Decode: <span style={{ color: C.text }}>&ldquo;{exercise.question}&rdquo;</span>
      </p>

      {/* Construction bar */}
      <div
        className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-lg"
        style={{ background: C.bg, border: `1px solid ${C.border}`, minHeight: 56 }}
      >
        {placed.length === 0 ? (
          <span style={{ fontSize: 13, color: C.muted }}>Tap fragments to rebuild the transmission…</span>
        ) : (
          placed.map((key) => (
            <button
              key={key}
              onClick={() => removeTile(key)}
              disabled={submitted}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: submitted ? 'default' : 'pointer',
                background: submitted ? (correct ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)') : C.accent,
                color: submitted ? (correct ? C.green : C.red) : C.bg,
                border: `1px solid ${submitted ? (correct ? 'rgba(74,222,128,0.4)' : 'rgba(248,113,113,0.4)') : C.accent}`,
              }}
            >
              {tiles[key].word}
            </button>
          ))
        )}
      </div>

      {/* Tile pool */}
      <div className="flex flex-wrap gap-2 mb-5" style={{ minHeight: 40 }}>
        {tiles.map((t) => {
          const used = placedSet.has(t.key);
          return (
            <button
              key={t.key}
              onClick={() => placeTile(t.key)}
              disabled={submitted || used}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: submitted || used ? 'default' : 'pointer',
                opacity: used ? 0.3 : 1,
                background: C.tile,
                color: C.text,
                border: `1px solid ${C.tileBorder}`,
              }}
            >
              {t.word}
            </button>
          );
        })}
      </div>

      {/* Feedback after submit */}
      {submitted && (
        <div className="mb-5">
          {!correct && (
            <p style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>
              Correct: <span style={{ color: C.green }}>{exercise.answer}</span>
            </p>
          )}
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{exercise.explanation}</p>
        </div>
      )}

      {!submitted && (
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={placed.length === 0}
            style={{
              padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: C.surface, color: C.muted, border: `1px solid ${C.border}`,
              cursor: placed.length === 0 ? 'default' : 'pointer', opacity: placed.length === 0 ? 0.5 : 1,
            }}
          >
            ← Undo
          </button>
          <button
            onClick={decode}
            disabled={placed.length === 0}
            className="flex-1"
            style={{
              padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 700,
              background: placed.length === 0 ? C.border : C.accent,
              color: placed.length === 0 ? C.muted : C.bg,
              border: 'none', cursor: placed.length === 0 ? 'default' : 'pointer',
            }}
          >
            Decode →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TheDecoderPage() {
  const { data: exercises = [], isLoading, refetch } = useExercises(
    { topic: 'the-decoder', type: 'BUILD', limit: 8 },
    true,
  );
  const { data: results } = useChallengeResults();
  const saveResult = useSaveChallengeResult();

  const total = exercises.length;

  const [phase, setPhase] = useState<'playing' | 'done'>('playing');
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [records, setRecords] = useState<DecoderRecord[]>([]);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const savedRef = useRef(false);
  const bestRef = useRef<number | null>(null);
  bestRef.current = results?.find((r) => r.challengeSlug === 'the-decoder')?.bestScore ?? null;

  useEffect(() => {
    if (phase === 'done' && !savedRef.current) {
      savedRef.current = true;
      saveResult.mutate({ challengeSlug: 'the-decoder', score: finalScore });
    }
  }, [phase, finalScore, saveResult]);

  function handleAnswered(rec: DecoderRecord, points: number) {
    const newRaw = raw + points;
    setRaw(newRaw);
    setRecords((prev) => [...prev, rec]);
    if (index + 1 >= total) {
      // Normalize raw (max = total * 100) onto a 1000-point scale before saving.
      const maxRaw = total * 100;
      const normalized = maxRaw > 0 ? Math.round((newRaw / maxRaw) * 1000) : 0;
      setFinalScore(normalized);
      setPrevBest(bestRef.current);
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
    }
  }

  function playAgain() {
    savedRef.current = false;
    setRaw(0);
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
        maxWidth: 660,
        minHeight: 440,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2" style={{ color: C.accent }}>
          <ChallengeIcon slug="the-decoder" size={16} color={C.accent} />
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
            The Decoder
          </span>
        </div>
        {phase === 'playing' && total > 0 && (
          <span style={{ fontSize: 12, color: C.muted }}>Transmission {index + 1} / {total}</span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.accent }} />
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="text-center py-12">
          <p style={{ color: C.muted, marginBottom: 16 }}>No transmissions intercepted yet. Check back soon.</p>
          <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>
            ← Back to Challenges
          </Link>
        </div>
      )}

      {!isLoading && total > 0 && phase === 'playing' && (
        <DecoderQuestion key={index} exercise={exercises[index]} onAnswered={handleAnswered} />
      )}

      {phase === 'done' && (
        <div>
          <div className="text-center mb-6">
            <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>
              {ratingFor(finalScore)}
            </p>
            <h2 style={{ fontSize: 40, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>
              {finalScore}
              <span style={{ fontSize: 20, color: C.muted }}> / 1000</span>
            </h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span
                style={{
                  background: badge ? 'rgba(96,165,250,0.15)' : C.surface,
                  color: badge ? C.accent : C.muted,
                  border: `1px solid ${badge ? 'rgba(96,165,250,0.4)' : C.border}`,
                  fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 99,
                }}
              >
                {badgeLabel(badge)}
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>
                {records.filter((r) => r.correct).length}/{total} decoded
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
                  <p style={{ color: C.muted, fontStyle: 'italic' }}>{r.english}</p>
                  {r.correct ? (
                    <p style={{ color: C.green, marginTop: 2 }}>{r.answer}</p>
                  ) : (
                    <>
                      <p style={{ color: C.red, marginTop: 2 }}>you: {r.built || '—'}</p>
                      <p style={{ color: C.accent }}>{r.answer}</p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <Link
              href="/grammar/challenges"
              style={{
                padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                background: C.surface, color: C.muted, border: `1px solid ${C.border}`, textDecoration: 'none',
              }}
            >
              Back to Challenges
            </Link>
            <button
              onClick={playAgain}
              style={{
                padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                background: C.accent, color: C.bg, border: 'none', cursor: 'pointer',
              }}
            >
              Decode Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
