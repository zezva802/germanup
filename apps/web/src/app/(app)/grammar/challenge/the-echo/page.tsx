'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@germanup/types';
import { useExercises } from '@/hooks/use-exercises';
import { useChallengeResults, useSaveChallengeResult } from '@/hooks/use-challenges';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';
import { ResultMark } from '@/components/challenges/result-mark';
import { badgeFor, badgeLabel } from '@/lib/challenge-scoring';

// ─── Brief-interception palette (inline only) ──────────────────────────────────
const C = {
  bg: '#0a0a0f',
  surface: '#13131a',
  border: '#222230',
  text: '#e8e8f0',
  muted: '#50505f',
  accent: '#a78bfa',
  flash: '#ffffff',
  green: '#4ade80',
  red: '#f87171',
};

function ratingFor(score: number): string {
  if (score >= 920) return 'Total recall';
  if (score >= 800) return 'Sharp memory';
  if (score >= 650) return 'Retained';
  if (score >= 500) return 'Fading echo';
  return 'Faint signal';
}

function pointsForRecall(both: boolean, one: boolean, timeMs: number): number {
  if (both) {
    if (timeMs < 10000) return 100;
    if (timeMs < 20000) return 80;
    if (timeMs < 35000) return 60;
    return 40;
  }
  return one ? 30 : 0;
}

const norm = (s: string) => s.trim().toLowerCase();

interface EchoRecord {
  sentence: string;
  typed: [string, string];
  answers: [string, string];
  c1: boolean;
  c2: boolean;
}

type Stage = 'ready' | 'flash' | 'recall' | 'result';

// ─── One echo (flash → recall → result) ────────────────────────────────────────
function EchoQuestion({
  exercise,
  onAnswered,
}: {
  exercise: Exercise;
  onAnswered: (rec: EchoRecord, points: number) => void;
}) {
  const answers = useMemo(() => {
    try {
      const a = JSON.parse(exercise.answer) as string[];
      return [a[0] ?? '', a[1] ?? ''] as [string, string];
    } catch {
      return ['', ''] as [string, string];
    }
  }, [exercise.answer]);
  const fullSentence = (exercise.options as string[] | null)?.[0] ?? exercise.question;
  const parts = useMemo(() => exercise.question.split('___'), [exercise.question]);

  const [stage, setStage] = useState<Stage>('ready');
  const [val1, setVal1] = useState('');
  const [val2, setVal2] = useState('');
  const [c1, setC1] = useState(false);
  const [c2, setC2] = useState(false);

  const recallStart = useRef(0);
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  // Ready (500ms) → Flash (exactly 2000ms) → Recall
  useEffect(() => {
    if (stage === 'ready') {
      const t = window.setTimeout(() => setStage('flash'), 500);
      return () => window.clearTimeout(t);
    }
    if (stage === 'flash') {
      const t = window.setTimeout(() => setStage('recall'), 2000);
      return () => window.clearTimeout(t);
    }
  }, [stage]);

  useEffect(() => {
    if (stage === 'recall') {
      recallStart.current = Date.now();
      input1Ref.current?.focus();
    }
  }, [stage]);

  function submit() {
    if (stage !== 'recall' || !val1.trim() || !val2.trim()) return;
    const correct1 = norm(val1) === norm(answers[0]);
    const correct2 = norm(val2) === norm(answers[1]);
    setC1(correct1);
    setC2(correct2);
    const both = correct1 && correct2;
    const one = correct1 !== correct2;
    const points = pointsForRecall(both, one, Date.now() - recallStart.current);
    const rec: EchoRecord = {
      sentence: fullSentence,
      typed: [val1, val2],
      answers,
      c1: correct1,
      c2: correct2,
    };
    setStage('result');
    window.setTimeout(() => onAnswered(rec, points), 1500);
  }

  function inputStyle(correct: boolean, done: boolean): React.CSSProperties {
    return {
      width: 'min(160px, 16ch)',
      fontSize: 18,
      textAlign: 'center',
      background: 'transparent',
      color: done ? (correct ? C.green : C.red) : C.accent,
      border: 'none',
      borderBottom: `2px solid ${done ? (correct ? C.green : C.red) : C.border}`,
      outline: 'none',
      margin: '0 4px',
    };
  }

  // ── Ready ──
  if (stage === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 220 }}>
        <ChallengeIcon slug="the-echo" size={32} color={C.muted} />
        <p style={{ color: C.muted, fontSize: 14, marginTop: 16, letterSpacing: '0.05em' }}>
          Intercepting transmission…
        </p>
      </div>
    );
  }

  // ── Flash ──
  if (stage === 'flash') {
    return (
      <div className="flex items-center justify-center text-center" style={{ minHeight: 220 }}>
        <p style={{ color: C.flash, fontSize: 22, fontWeight: 600, lineHeight: 1.5 }}>{fullSentence}</p>
      </div>
    );
  }

  // ── Recall / Result ──
  const done = stage === 'result';
  return (
    <div style={{ minHeight: 220 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, marginBottom: 16 }}>
        Rebuild the transmission from memory
      </p>

      <p style={{ fontSize: 18, lineHeight: 2, color: C.text }}>
        <span>{parts[0]}</span>
        <input
          ref={input1Ref}
          value={val1}
          onChange={(e) => setVal1(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (val1.trim()) input2Ref.current?.focus();
            }
          }}
          disabled={done}
          spellCheck={false}
          autoComplete="off"
          style={inputStyle(c1, done)}
        />
        <span>{parts[1] ?? ' '}</span>
        <input
          ref={input2Ref}
          value={val2}
          onChange={(e) => setVal2(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          disabled={done}
          spellCheck={false}
          autoComplete="off"
          style={inputStyle(c2, done)}
        />
        <span>{parts[2] ?? ''}</span>
      </p>

      {done ? (
        <div className="mt-6">
          {(!c1 || !c2) && (
            <p style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>
              Answer:{' '}
              <span style={{ color: C.accent, fontWeight: 700 }}>{answers[0]}</span>
              {' … '}
              <span style={{ color: C.accent, fontWeight: 700 }}>{answers[1]}</span>
            </p>
          )}
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{exercise.explanation}</p>
        </div>
      ) : (
        <button
          onClick={submit}
          disabled={!val1.trim() || !val2.trim()}
          className="mt-6 w-full"
          style={{
            padding: '10px 0',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            background: !val1.trim() || !val2.trim() ? C.border : C.accent,
            color: !val1.trim() || !val2.trim() ? C.muted : '#111',
            border: 'none',
            cursor: !val1.trim() || !val2.trim() ? 'default' : 'pointer',
          }}
        >
          Submit
        </button>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TheEchoPage() {
  const { data: exercises = [], isLoading, refetch } = useExercises(
    { topic: 'the-echo', type: 'ECHO', limit: 10 },
    true,
  );
  const { data: results } = useChallengeResults();
  const saveResult = useSaveChallengeResult();

  const total = exercises.length;

  const [phase, setPhase] = useState<'playing' | 'done'>('playing');
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [records, setRecords] = useState<EchoRecord[]>([]);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const savedRef = useRef(false);
  const bestRef = useRef<number | null>(null);
  bestRef.current = results?.find((r) => r.challengeSlug === 'the-echo')?.bestScore ?? null;

  useEffect(() => {
    if (phase === 'done' && !savedRef.current) {
      savedRef.current = true;
      saveResult.mutate({ challengeSlug: 'the-echo', score: finalScore });
    }
  }, [phase, finalScore, saveResult]);

  function handleAnswered(rec: EchoRecord, points: number) {
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
        maxWidth: 620,
        minHeight: 360,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2" style={{ color: C.accent }}>
          <ChallengeIcon slug="the-echo" size={16} color={C.accent} />
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
            The Echo
          </span>
        </div>
        {phase === 'playing' && total > 0 && (
          <span style={{ fontSize: 12, color: C.muted }}>Echo {index + 1} / {total}</span>
        )}
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.accent }} />
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="text-center py-12">
          <p style={{ color: C.muted, marginBottom: 16 }}>No transmissions to echo yet. Check back soon.</p>
          <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>
            ← Back to Challenges
          </Link>
        </div>
      )}

      {!isLoading && total > 0 && phase === 'playing' && (
        <EchoQuestion key={index} exercise={exercises[index]} onAnswered={handleAnswered} />
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
                  background: badge ? 'rgba(167,139,250,0.15)' : C.surface,
                  color: badge ? C.accent : C.muted,
                  border: `1px solid ${badge ? 'rgba(167,139,250,0.4)' : C.border}`,
                  fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 99,
                }}
              >
                {badgeLabel(badge)}
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>
                {records.filter((r) => r.c1 && r.c2).length}/{total} fully recalled
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
                className="px-3 py-2.5"
                style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.border}`, fontSize: 13 }}
              >
                <p style={{ color: C.text, marginBottom: 4 }}>{r.sentence}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {[0, 1].map((b) => {
                    const ok = b === 0 ? r.c1 : r.c2;
                    return (
                      <span key={b} className="flex items-center gap-1.5">
                        <ResultMark ok={ok} okColor={C.green} failColor={C.red} size={12} />
                        {ok ? (
                          <span style={{ color: C.green }}>{r.answers[b]}</span>
                        ) : (
                          <span style={{ color: C.muted }}>
                            <span style={{ color: C.red }}>{r.typed[b] || '—'}</span> → <span style={{ color: C.accent }}>{r.answers[b]}</span>
                          </span>
                        )}
                      </span>
                    );
                  })}
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
                background: C.accent, color: '#111', border: 'none', cursor: 'pointer',
              }}
            >
              Echo Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
