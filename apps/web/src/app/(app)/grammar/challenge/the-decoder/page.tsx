'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@germanup/types';
import { useExercises } from '@/hooks/use-exercises';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { useCountUp } from '@/hooks/use-count-up';
import { useChallengeResults, useSaveChallengeResult } from '@/hooks/use-challenges';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';
import { ChallengeHud } from '@/components/challenges/challenge-hud';
import { ChallengeIntro } from '@/components/challenges/challenge-intro';
import { SoundToggle } from '@/components/challenges/sound-toggle';
import { ResultMark } from '@/components/challenges/result-mark';
import { playSound, resumeAudio } from '@/lib/challenge-sound';
import { badgeFor, badgeLabel, comboMultiplier, normalizeScore, perfectComboRaw } from '@/lib/challenge-scoring';

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
  red: '#f87171',
};
const THEME = { accent: C.accent, text: C.text, muted: C.muted, surface: C.surface, border: C.border };
const MONO = "'Courier New', Courier, monospace";

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
  multiplier,
  perfectRaw,
  onAnswered,
}: {
  exercise: Exercise;
  multiplier: number;
  perfectRaw: number;
  onAnswered: (rec: DecoderRecord, correct: boolean, base: number) => void;
}) {
  const [tiles] = useState<Tile[]>(() => {
    const opts = (exercise.options as string[] | null) ?? [];
    return [...opts].sort(() => Math.random() - 0.5).map((word, key) => ({ word, key }));
  });

  const startRef = useRef(Date.now());
  const [placed, setPlaced] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [gain, setGain] = useState(0);

  const placedSet = new Set(placed);
  const built = placed.map((k) => tiles[k].word).join(' ');

  function placeTile(key: number) {
    if (submitted) return;
    playSound('click');
    setPlaced((prev) => [...prev, key]);
  }
  function removeTile(key: number) {
    if (submitted) return;
    playSound('click');
    setPlaced((prev) => prev.filter((k) => k !== key));
  }
  function undo() {
    if (submitted || placed.length === 0) return;
    playSound('click');
    setPlaced((prev) => prev.slice(0, -1));
  }

  function decode() {
    if (submitted) return;
    const isCorrect = built === exercise.answer;
    const base = isCorrect ? pointsForTime(Date.now() - startRef.current) : 0;
    playSound('click');
    playSound(isCorrect ? 'correct' : 'wrong');
    if (isCorrect && perfectRaw > 0) {
      setGain(Math.round(((base * multiplier) / perfectRaw) * 1000));
    }
    setCorrect(isCorrect);
    setSubmitted(true);
    const rec: DecoderRecord = { english: exercise.question, built, answer: exercise.answer, correct: isCorrect };
    window.setTimeout(() => onAnswered(rec, isCorrect, base), 1500);
  }

  return (
    <div className="ch-fade-in">
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 18, fontFamily: MONO }}>
        &gt; Decode: <span style={{ color: C.text }}>&ldquo;{exercise.question}&rdquo;</span>
      </p>

      {/* Construction bar */}
      <div style={{ position: 'relative' }}>
        <div
          className="flex flex-wrap gap-2 items-center mb-5 p-3 rounded-lg"
          style={{ background: C.bg, border: `1px solid ${submitted ? (correct ? 'rgba(96,165,250,0.5)' : 'rgba(248,113,113,0.5)') : C.border}`, minHeight: 56, boxShadow: submitted && correct ? '0 0 22px rgba(96,165,250,0.25)' : 'none' }}
        >
          {placed.length === 0 ? (
            <span style={{ fontSize: 13, color: C.muted, fontFamily: MONO }}>Tap fragments to rebuild the transmission…</span>
          ) : (
            placed.map((key) => (
              <button
                key={key}
                onClick={() => removeTile(key)}
                disabled={submitted}
                className={submitted && correct ? 'ch-mark' : undefined}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: MONO,
                  cursor: submitted ? 'default' : 'pointer',
                  background: submitted ? (correct ? 'rgba(96,165,250,0.18)' : 'rgba(248,113,113,0.18)') : C.accent,
                  color: submitted ? (correct ? C.accent : C.red) : C.bg,
                  border: `1px solid ${submitted ? (correct ? 'rgba(96,165,250,0.4)' : 'rgba(248,113,113,0.4)') : C.accent}`,
                }}
              >
                {tiles[key].word}
              </button>
            ))
          )}
        </div>
        {submitted && correct && gain > 0 && (
          <span
            className="ch-float-up"
            style={{ position: 'absolute', left: '50%', top: 0, fontSize: 13, fontWeight: 800, color: C.accent, pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            +{gain}
          </span>
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
                fontFamily: MONO,
                cursor: submitted || used ? 'default' : 'pointer',
                opacity: used ? 0.25 : 1,
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
              Correct: <span style={{ color: C.accent }}>{exercise.answer}</span>
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
              padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: MONO,
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
              padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: MONO, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: placed.length === 0 ? C.border : C.accent,
              color: placed.length === 0 ? C.muted : C.bg,
              border: 'none', cursor: placed.length === 0 ? 'default' : 'pointer',
              boxShadow: placed.length === 0 ? 'none' : '0 0 22px rgba(96,165,250,0.3)',
            }}
          >
            ▸ Decode
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
  const perfectRaw = useMemo(() => perfectComboRaw(total), [total]);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [runId, setRunId] = useState(0);
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [comboFlashKey, setComboFlashKey] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [records, setRecords] = useState<DecoderRecord[]>([]);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const savedRef = useRef(false);
  const timeMs = useStopwatch(phase === 'playing', runId);
  const shownScore = useCountUp(phase === 'done' ? finalScore : 0);

  const det = results?.find((r) => r.challengeSlug === 'the-decoder');
  const bestRef = useRef<number | null>(null);
  bestRef.current = det?.bestScore ?? null;
  const interceptNo = String((det?.playsCount ?? 0) + 1).padStart(4, '0');

  useEffect(() => {
    if (phase === 'done' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish');
      saveResult.mutate({ challengeSlug: 'the-decoder', score: finalScore });
    }
  }, [phase, finalScore, saveResult]);

  function begin() {
    resumeAudio();
    savedRef.current = false;
    setIndex(0);
    setRaw(0);
    setStreak(0);
    setBestStreak(0);
    setFinalScore(0);
    setRecords([]);
    setPrevBest(null);
    setRunId((r) => r + 1);
    setPhase('playing');
  }

  function handleAnswered(rec: DecoderRecord, correct: boolean, base: number) {
    let gain = 0;
    let nextStreak = 0;
    if (correct) {
      gain = Math.round(base * comboMultiplier(streak));
      nextStreak = streak + 1;
      if (comboMultiplier(nextStreak) > comboMultiplier(streak)) {
        playSound('combo');
        setComboFlashKey((k) => k + 1);
      }
      setRaw((p) => p + gain);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
    } else {
      setStreak(0);
    }
    setRecords((prev) => [...prev, rec]);

    if (index + 1 >= total) {
      setFinalScore(normalizeScore(raw + gain, perfectRaw));
      setPrevBest(bestRef.current);
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
    }
  }

  function playAgain() {
    refetch();
    begin();
  }

  const badge = badgeFor(finalScore);
  const isNewBest = phase === 'done' && (prevBest === null || finalScore > prevBest);

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        maxWidth: 660,
        minHeight: 460,
        background: 'linear-gradient(165deg, #0b0f1e 0%, #080a12 45%, #04060e 100%)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
      }}
    >
      {/* ── Transmission scene: signal glow, interference scanlines, vignette, grain ── */}
      <div aria-hidden className="noir-lamp-flicker" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 85% at 50% -14%, rgba(96,165,250,0.18), rgba(96,165,250,0.05) 40%, transparent 62%)' }} />
      <div aria-hidden className="crt-scanlines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.7 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 36%, transparent 42%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.72) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(96,165,250,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" style={{ color: C.accent }}>
            <ChallengeIcon slug="the-decoder" size={16} color={C.accent} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: MONO }}>
              The Decoder<span className="crt-cursor" style={{ color: C.accent }}>_</span>
            </span>
          </div>
          <SoundToggle accent={C.accent} muted={C.muted} />
        </div>

        {/* Intercept strip */}
        {!isLoading && total > 0 && (
          <div
            className="flex items-center justify-between mb-6"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '6px 2px' }}
          >
            <span>Intercept</span>
            <span style={{ color: C.accent, fontWeight: 700 }}>Nº {interceptNo}</span>
          </div>
        )}

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

        {!isLoading && total > 0 && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-decoder"
            kicker="Incoming Transmission"
            title="The Decoder"
            tagline="The signal came through scrambled, with decoy fragments mixed in. Reassemble each transmission into the correct German sentence."
            rules={[
              'Tap word fragments to build the sentence; tap a placed one to send it back.',
              'Some fragments are decoys — they will not fit. Hit Decode when ready.',
              'Decode transmissions in a row to build a streak and multiply your score.',
            ]}
            bestBadge={badgeFor(det?.bestScore ?? 0)}
            bestScore={det?.bestScore ?? null}
            beginLabel="Lock Onto Signal"
            onBegin={begin}
            titleFontFamily={MONO}
          />
        )}

        {!isLoading && total > 0 && phase === 'playing' && (
          <div>
            <ChallengeHud
              {...THEME}
              unit="Transmission"
              index={index}
              total={total}
              points={normalizeScore(raw, perfectRaw)}
              streak={streak}
              multiplier={comboMultiplier(streak)}
              timeMs={timeMs}
              comboFlashKey={comboFlashKey}
            />
            <DecoderQuestion
              key={index}
              exercise={exercises[index]}
              multiplier={comboMultiplier(streak)}
              perfectRaw={perfectRaw}
              onAnswered={handleAnswered}
            />
          </div>
        )}

        {phase === 'done' && (
          <div>
            <div className="text-center mb-6">
              <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 8, fontFamily: MONO }}>
                {ratingFor(finalScore)}
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
                <span style={{ fontSize: 13, color: C.muted }}>Best streak {bestStreak}</span>
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
                  <div className="mt-0.5"><ResultMark ok={r.correct} okColor={C.accent} failColor={C.red} /></div>
                  <div className="min-w-0 flex-1">
                    <p style={{ color: C.muted, fontStyle: 'italic' }}>{r.english}</p>
                    {r.correct ? (
                      <p style={{ color: C.accent, marginTop: 2 }}>{r.answer}</p>
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
    </div>
  );
}
