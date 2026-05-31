'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@germanup/types';
import { useExercises } from '@/hooks/use-exercises';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { useCountUp } from '@/hooks/use-count-up';
import { useChallengeResults, useSaveChallengeResult } from '@/hooks/use-challenges';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';
import { ChallengeIntro } from '@/components/challenges/challenge-intro';
import { SoundToggle } from '@/components/challenges/sound-toggle';
import { ResultMark } from '@/components/challenges/result-mark';
import { playSound, resumeAudio } from '@/lib/challenge-sound';
import { badgeFor, badgeLabel, formatTime } from '@/lib/challenge-scoring';

// ─── Terminal palette (inline only) ────────────────────────────────────────────
const C = {
  bg: '#050f08',
  surface: '#0a1a0e',
  border: '#1a3020',
  text: '#d4f0dc',
  muted: '#4a7a58',
  accent: '#22c55e',
  red: '#f87171',
};
const THEME = { accent: C.accent, text: C.text, muted: C.muted, surface: C.surface, border: C.border };
const MONO = "'Courier New', Courier, monospace";

function ratingFor(score: number): string {
  if (score >= 920) return 'Signal locked';
  if (score >= 800) return 'Clean transmission';
  if (score >= 650) return 'Decrypted';
  if (score >= 500) return 'Partial intercept';
  return 'Signal lost';
}

function bonusForTime(timeMs: number): number {
  if (timeMs < 13000) return 300;
  if (timeMs < 25000) return 200;
  if (timeMs < 40000) return 100;
  return 50;
}

// ─── One sorting run (one exercise) ─────────────────────────────────────────────
function CipherRun({ exercise, op, onPlayAgain }: { exercise: Exercise; op: string; onPlayAgain: () => void }) {
  const answerMap = useMemo(() => JSON.parse(exercise.answer) as Record<string, string>, [exercise.answer]);
  const items = useMemo(() => (exercise.options as string[] | null) ?? [], [exercise.options]);
  const categories = useMemo(() => [...new Set(Object.values(answerMap))], [answerMap]);

  const runStart = useRef(Date.now());
  const submittedAtRef = useRef(0);
  const savedRef = useRef(false);

  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const { data: results } = useChallengeResults();
  const saveResult = useSaveChallengeResult();
  const prevBestRef = useRef<number | null>(null);
  prevBestRef.current = results?.find((r) => r.challengeSlug === 'the-cipher')?.bestScore ?? null;

  const liveMs = useStopwatch(!submitted);

  const placedCount = items.filter((i) => assignments[i]).length;
  const allPlaced = placedCount === items.length && items.length > 0;

  // Score (only meaningful once submitted)
  const correctCount = items.filter((i) => answerMap[i] === assignments[i]).length;
  const accuracyScore = Math.round((correctCount / items.length) * 700);
  const elapsedMs = submittedAtRef.current ? submittedAtRef.current - runStart.current : 0;
  const timeBonus = accuracyScore === 700 ? bonusForTime(elapsedMs) : 0;
  const totalScore = accuracyScore + timeBonus;
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const shownScore = useCountUp(revealed ? totalScore : 0);

  function assign(item: string, category: string) {
    setAssignments((prev) => ({ ...prev, [item]: category }));
    setSelected(null);
    playSound('click', 'cipher');
  }

  function handleItemClick(item: string) {
    if (submitted) return;
    playSound('click', 'cipher');
    setSelected((prev) => (prev === item ? null : item));
  }

  function handleBucketClick(category: string) {
    if (submitted || !selected) return;
    assign(selected, category);
  }

  function handlePlacedClick(item: string) {
    if (submitted) return;
    playSound('click', 'cipher');
    setAssignments((prev) => {
      const next = { ...prev };
      delete next[item];
      return next;
    });
    setSelected(null);
  }

  // Keyboard: 1/2/3 assign the selected item to a bucket by position.
  useEffect(() => {
    if (submitted || !selected) return;
    function onKey(e: KeyboardEvent) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= categories.length) {
        assign(selected!, categories[n - 1]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, submitted, categories]);

  function handleTransmit() {
    if (!allPlaced || submitted) return;
    submittedAtRef.current = Date.now();
    setPrevBest(prevBestRef.current);
    setSubmitted(true);
    playSound('click', 'cipher');
    window.setTimeout(() => {
      setRevealed(true);
      playSound('finish', 'cipher');
    }, 800);
  }

  // Save once, after submit (score is stable by then).
  useEffect(() => {
    if (submitted && !savedRef.current) {
      savedRef.current = true;
      saveResult.mutate({ challengeSlug: 'the-cipher', score: totalScore });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const badge = badgeFor(totalScore);
  const isNewBest = prevBest === null || totalScore > prevBest;
  const unplaced = items.filter((i) => !assignments[i]);
  const routedPct = items.length > 0 ? (placedCount / items.length) * 100 : 0;

  return (
    <div>
      {!revealed && (
        <>
          {/* Terminal status line */}
          <div
            className="flex items-center justify-between mb-2"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '6px 2px' }}
          >
            <span>OP Nº {op}</span>
            <span style={{ color: submitted ? C.muted : C.accent }}>
              Routed {String(placedCount).padStart(2, '0')}/{String(items.length).padStart(2, '0')}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(liveMs)}</span>
          </div>
          <div className="h-0.5 rounded-full overflow-hidden mb-6" style={{ background: C.border }}>
            <div className="h-full rounded-full" style={{ width: `${routedPct}%`, background: C.accent, transition: 'width 0.2s linear' }} />
          </div>

          {/* Item pool */}
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, marginBottom: 10, fontFamily: MONO }}>
            &gt; Intercepted signals — route each to its department
          </p>
          <div
            className="flex flex-wrap gap-2 p-3 mb-6 rounded-lg"
            style={{ background: C.surface, border: `1px solid ${C.border}`, minHeight: 56 }}
          >
            {unplaced.length === 0 ? (
              <span className="self-center w-full text-center" style={{ fontSize: 13, color: C.muted, fontFamily: MONO }}>
                All signals routed — ready to transmit
              </span>
            ) : (
              unplaced.map((item) => {
                const isSel = selected === item;
                return (
                  <button
                    key={item}
                    onClick={() => handleItemClick(item)}
                    disabled={submitted}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: MONO,
                      cursor: submitted ? 'default' : 'pointer',
                      background: isSel ? C.accent : C.border,
                      color: isSel ? C.bg : C.text,
                      border: `1px solid ${isSel ? C.accent : C.border}`,
                      boxShadow: isSel ? `0 0 14px rgba(34,197,94,0.5)` : 'none',
                    }}
                  >
                    {item}
                  </button>
                );
              })
            )}
          </div>

          {/* Buckets */}
          <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
            {categories.map((category, ci) => {
              const inBucket = items.filter((i) => assignments[i] === category);
              return (
                <div
                  key={category}
                  onClick={() => handleBucketClick(category)}
                  style={{
                    minHeight: 80,
                    padding: 12,
                    borderRadius: 10,
                    background: C.surface,
                    border: submitted ? `1px solid ${C.border}` : `1px dashed ${selected ? C.accent : C.border}`,
                    cursor: !submitted && selected ? 'pointer' : 'default',
                    boxShadow: !submitted && selected ? `inset 0 0 22px rgba(34,197,94,0.07)` : 'none',
                  }}
                >
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: 8, fontWeight: 700, fontFamily: MONO }}>
                    <span style={{ color: C.accent }}>[{ci + 1}]</span> {category}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {inBucket.map((item) => {
                      const isRight = submitted && answerMap[item] === category;
                      const isWrong = submitted && answerMap[item] !== category;
                      return (
                        <button
                          key={item}
                          onClick={(e) => { e.stopPropagation(); handlePlacedClick(item); }}
                          disabled={submitted}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 7,
                            fontSize: 13,
                            fontWeight: 600,
                            fontFamily: MONO,
                            cursor: submitted ? 'default' : 'pointer',
                            background: isRight ? 'rgba(34,197,94,0.18)' : isWrong ? 'rgba(248,113,113,0.18)' : C.border,
                            color: isRight ? C.accent : isWrong ? C.red : C.text,
                            border: `1px solid ${isRight ? 'rgba(34,197,94,0.4)' : isWrong ? 'rgba(248,113,113,0.4)' : C.border}`,
                          }}
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

          {!submitted && (
            <button
              onClick={handleTransmit}
              disabled={!allPlaced}
              className="w-full"
              style={{
                padding: '11px 0',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 14,
                fontFamily: MONO,
                background: allPlaced ? C.accent : C.border,
                color: allPlaced ? C.bg : C.muted,
                border: 'none',
                cursor: allPlaced ? 'pointer' : 'default',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                boxShadow: allPlaced ? `0 0 22px rgba(34,197,94,0.35)` : 'none',
              }}
            >
              {allPlaced ? '▸ Transmit' : `Route ${unplaced.length} more signal${unplaced.length === 1 ? '' : 's'}`}
            </button>
          )}

          {submitted && (
            <p style={{ textAlign: 'center', fontFamily: MONO, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.accent }}>
              Decrypting<span className="crt-cursor">▓</span>
            </p>
          )}
        </>
      )}

      {/* Results */}
      {revealed && (
        <div>
          <div className="text-center mb-6">
            <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 8, fontFamily: MONO }}>
              {ratingFor(totalScore)}
            </p>
            <h2 style={{ fontSize: 42, fontWeight: 800, color: C.text, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {shownScore}
              <span style={{ fontSize: 20, color: C.muted }}> / 1000</span>
            </h2>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span
                className="ch-stamp-in"
                style={{
                  display: 'inline-block',
                  background: badge ? 'rgba(34,197,94,0.15)' : C.surface,
                  color: badge ? C.accent : C.muted,
                  border: `1px solid ${badge ? 'rgba(34,197,94,0.4)' : C.border}`,
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '5px 14px',
                  borderRadius: 99,
                }}
              >
                {badgeLabel(badge)}
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>
                {correctCount}/{items.length} placed · {formatTime(elapsedMs)}
              </span>
            </div>
            {isNewBest && totalScore > 0 && (
              <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginTop: 6 }}>New personal best!</p>
            )}
          </div>

          {/* Breakdown */}
          <div className="rounded-lg mb-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {items.map((item, i) => {
              const ok = answerMap[item] === assignments[item];
              return (
                <div
                  key={item}
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.border}`, fontSize: 13, fontFamily: MONO }}
                >
                  <ResultMark ok={ok} okColor={C.accent} failColor={C.red} />
                  <span style={{ color: C.text, fontWeight: 600 }}>{item}</span>
                  <span style={{ color: C.muted, marginLeft: 'auto' }}>
                    {ok ? answerMap[item] : <>you: {assignments[item]} → <span style={{ color: C.accent }}>{answerMap[item]}</span></>}
                  </span>
                </div>
              );
            })}
          </div>

          {exercise.explanation && (
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20, lineHeight: 1.5 }}>{exercise.explanation}</p>
          )}

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
              onClick={onPlayAgain}
              style={{
                padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14,
                background: C.accent, color: C.bg, border: 'none', cursor: 'pointer',
              }}
            >
              New Run
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TheCipherPage() {
  const { data: exercises = [], isLoading } = useExercises(
    { topic: 'the-cipher', type: 'SORT', limit: 20 },
    true,
  );
  const { data: results } = useChallengeResults();

  const [phase, setPhase] = useState<'intro' | 'running'>('intro');
  const [runKey, setRunKey] = useState(0);

  // Pick a random exercise per run.
  const chosen = useMemo(() => {
    if (exercises.length === 0) return null;
    return exercises[Math.floor(Math.random() * exercises.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, runKey]);

  const det = results?.find((r) => r.challengeSlug === 'the-cipher');
  const op = String((det?.playsCount ?? 0) + 1).padStart(4, '0');

  function begin() {
    resumeAudio();
    setRunKey((k) => k + 1);
    setPhase('running');
  }

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        maxWidth: 680,
        minHeight: 460,
        background: 'linear-gradient(165deg, #07160d 0%, #050f08 45%, #020704 100%)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
      }}
    >
      {/* ── CRT terminal scene: phosphor glow, screen flicker, refresh beam, scanlines ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 90% at 50% 30%, rgba(34,197,94,0.12), rgba(34,197,94,0.03) 45%, transparent 70%)' }} />
      <div aria-hidden className="crt-flicker" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'rgba(34,197,94,0.03)' }} />
      <div aria-hidden className="crt-sweep" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 80, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent, rgba(150,255,190,0.07), transparent)' }} />
      <div aria-hidden className="crt-scanlines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 38%, transparent 42%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.74) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(34,197,94,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" style={{ color: C.accent }}>
            <ChallengeIcon slug="the-cipher" size={16} color={C.accent} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: MONO }}>
              The Cipher<span className="crt-cursor" style={{ color: C.accent }}>_</span>
            </span>
          </div>
          <SoundToggle accent={C.accent} muted={C.muted} />
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.accent }} />
          </div>
        )}

        {!isLoading && !chosen && (
          <div className="text-center py-12">
            <p style={{ color: C.muted, marginBottom: 16 }}>No signals to decrypt yet. Check back soon.</p>
            <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>
              ← Back to Challenges
            </Link>
          </div>
        )}

        {!isLoading && chosen && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-cipher"
            kicker="Signals Intercepted"
            title="The Cipher"
            tagline="A burst of intercepted signals just came in. Route every one to its correct department before the channel closes."
            rules={[
              'Select a signal, then click a department — or press its number key (1–3).',
              'Route all signals, then hit Transmit to decrypt.',
              'Only a flawless sort earns a time bonus — speed and precision both count.',
            ]}
            bestBadge={badgeFor(det?.bestScore ?? 0)}
            bestScore={det?.bestScore ?? null}
            beginLabel="Open Channel"
            onBegin={begin}
            titleFontFamily={MONO}
          />
        )}

        {!isLoading && chosen && phase === 'running' && (
          <CipherRun key={`${runKey}-${chosen.id}`} exercise={chosen} op={op} onPlayAgain={() => setRunKey((k) => k + 1)} />
        )}
      </div>
    </div>
  );
}
