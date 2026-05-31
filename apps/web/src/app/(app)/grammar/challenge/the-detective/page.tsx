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
import { playSound, resumeAudio } from '@/lib/challenge-sound';
import {
  badgeFor,
  badgeLabel,
  comboMultiplier,
  formatTime,
  normalizeScore,
  perfectComboRaw,
} from '@/lib/challenge-scoring';

// ─── Noir palette (inline only — does not touch globals) ───────────────────────
const C = {
  bg: '#0a0806',
  surface: '#12100d',
  border: '#2a2318',
  text: '#f0e8d8',
  muted: '#8a7560',
  accent: '#d4922a',
  green: '#4ade80',
  red: '#f87171',
};
const THEME = { accent: C.accent, text: C.text, muted: C.muted, surface: C.surface, border: C.border };

function ratingFor(score: number): string {
  if (score >= 920) return 'Masterful';
  if (score >= 800) return 'Sharp eye';
  if (score >= 650) return 'Solid work';
  if (score >= 500) return 'On the trail';
  return 'Case unsolved';
}

function pointsForTime(timeMs: number): number {
  if (timeMs < 5000) return 100;
  if (timeMs < 10000) return 80;
  if (timeMs < 20000) return 60;
  return 40;
}

const clean = (w: string) => w.replace(/[.,!?;:]/g, '').toLowerCase();

// ─── A single interrogation (one sentence) ─────────────────────────────────────
function DetectiveQuestion({
  exercise,
  multiplier,
  perfectRaw,
  onAnswered,
}: {
  exercise: Exercise;
  multiplier: number;
  perfectRaw: number;
  onAnswered: (correct: boolean, base: number) => void;
}) {
  const words = useMemo(() => exercise.question.split(' ').filter(Boolean), [exercise.question]);
  const wrongWordClean = clean((exercise.options as string[] | null)?.[0] ?? '');

  const startRef = useRef(Date.now());
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gain, setGain] = useState(0);

  // Live "points available" for this case (freezes on submit).
  const elapsed = useStopwatch(!submitted);
  const worth = pointsForTime(elapsed);
  const barPct = submitted ? 0 : Math.max(0, 100 - (elapsed / 20000) * 100);

  function handleClick(i: number) {
    if (submitted) return;
    const isCorrect = clean(words[i]) === wrongWordClean;
    const base = isCorrect ? pointsForTime(Date.now() - startRef.current) : 0;
    playSound('click');
    playSound(isCorrect ? 'correct' : 'wrong');
    // Display the gain on the same 0–1000 scale as the final score.
    setGain(perfectRaw > 0 ? Math.round(((base * multiplier) / perfectRaw) * 1000) : 0);
    setClickedIdx(i);
    setSubmitted(true);
    window.setTimeout(() => onAnswered(isCorrect, base), 600);
  }

  return (
    <div className="ch-fade-in">
      {/* Per-case worth meter */}
      <div className="flex items-center justify-between mb-2" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
        <span style={{ color: C.muted, textTransform: 'uppercase' }}>This case is worth</span>
        <span style={{ color: worth >= 80 ? C.accent : C.muted, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {worth} pts
        </span>
      </div>
      <div className="h-0.5 rounded-full overflow-hidden mb-6" style={{ background: C.border }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${barPct}%`, background: C.accent, transition: 'width 0.2s linear', opacity: 0.5 + (barPct / 200) }}
        />
      </div>

      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, marginBottom: 16 }}>
        One word is guilty. Click it.
      </p>
      <p style={{ fontSize: 20, lineHeight: 1.9, color: C.text, fontFamily: "Georgia, 'Times New Roman', serif", textShadow: '0 1px 14px rgba(212,146,42,0.12)' }}>
        {words.map((word, i) => {
          const isTarget = clean(word) === wrongWordClean;
          const isWrongClick = submitted && i === clickedIdx && !isTarget;
          let style: React.CSSProperties = {
            position: 'relative',
            cursor: submitted ? 'default' : 'pointer',
            borderRadius: 4,
            padding: '0 2px',
            transition: 'background 0.15s, color 0.15s',
            display: 'inline-block',
          };
          let cls = submitted ? '' : 'detective-word';
          if (submitted && isTarget) {
            style = { ...style, background: 'rgba(74,222,128,0.18)', color: C.green };
            cls = 'ch-pulse-ok';
          } else if (isWrongClick) {
            style = { ...style, background: 'rgba(248,113,113,0.18)', color: C.red };
            cls = 'ch-nudge';
          }
          return (
            <span key={i}>
              {i > 0 && ' '}
              <span onClick={() => handleClick(i)} style={style} className={cls}>
                {word}
                {submitted && i === clickedIdx && isTarget && gain > 0 && (
                  <span
                    className="ch-float-up"
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: -4,
                      fontSize: 13,
                      fontWeight: 800,
                      color: C.accent,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    +{gain}
                  </span>
                )}
              </span>
            </span>
          );
        })}
      </p>
    </div>
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
  const perfectRaw = useMemo(() => perfectComboRaw(total), [total]);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [runId, setRunId] = useState(0);
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [comboFlashKey, setComboFlashKey] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const pageStart = useRef(Date.now());
  const savedRef = useRef(false);
  const timeMs = useStopwatch(phase === 'playing', runId);
  const shownScore = useCountUp(phase === 'done' ? finalScore : 0);

  const bestRef = useRef<number | null>(null);
  bestRef.current = results?.find((r) => r.challengeSlug === 'the-detective')?.bestScore ?? null;

  useEffect(() => {
    if (phase === 'done' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish');
      saveResult.mutate({ challengeSlug: 'the-detective', score: finalScore });
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
    setElapsedMs(0);
    setPrevBest(null);
    pageStart.current = Date.now();
    setRunId((r) => r + 1);
    setPhase('playing');
  }

  function handleAnswered(correct: boolean, base: number) {
    let gain = 0;
    let nextStreak = 0;
    if (correct) {
      gain = Math.round(base * comboMultiplier(streak));
      nextStreak = streak + 1;
      // Combo cue when crossing into a higher multiplier tier.
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

    if (index + 1 >= total) {
      const finalRaw = raw + gain;
      setFinalScore(normalizeScore(finalRaw, perfectRaw));
      setElapsedMs(Date.now() - pageStart.current);
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
        maxWidth: 640,
        minHeight: 460,
        background: 'linear-gradient(165deg, #100c08 0%, #0a0806 45%, #050403 100%)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
      }}
    >
      {/* ── Noir scene: lamp pool, venetian-blind light, vignette, film grain ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(130% 95% at 50% -18%, rgba(212,146,42,0.18), rgba(212,146,42,0.04) 38%, transparent 60%)' }} />
      <div aria-hidden className="noir-blinds" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 34%, transparent 40%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0.72) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
      <style>{`.detective-word:hover { text-decoration: underline; text-decoration-color: ${C.accent}; }`}</style>

      {/* Header (always) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2" style={{ color: C.accent }}>
          <ChallengeIcon slug="the-detective" size={16} color={C.accent} />
          <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
            The Detective
          </span>
        </div>
        <SoundToggle accent={C.accent} muted={C.muted} />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.accent }} />
        </div>
      )}

      {!isLoading && total === 0 && (
        <div className="text-center py-12">
          <p style={{ color: C.muted, marginBottom: 16 }}>No cases on file yet. Check back soon.</p>
          <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>
            ← Back to Challenges
          </Link>
        </div>
      )}

      {/* Intro / briefing */}
      {!isLoading && total > 0 && phase === 'intro' && (
        <ChallengeIntro
          {...THEME}
          slug="the-detective"
          kicker="Case File"
          title="The Detective"
          tagline="Every statement on file hides exactly one grammatical lie. Expose the guilty word before the trail goes cold."
          rules={[
            'Read each sentence and click the one word that is wrong.',
            'The faster you crack a case, the more points you bank.',
            'Solve cases back-to-back to build a streak and multiply your score.',
          ]}
          bestBadge={badgeFor(bestRef.current ?? 0)}
          bestScore={bestRef.current}
          beginLabel="Open the Case File"
          onBegin={begin}
          titleFontFamily="Georgia, 'Times New Roman', serif"
        />
      )}

      {/* Playing */}
      {!isLoading && total > 0 && phase === 'playing' && (
        <div>
          <ChallengeHud
            {...THEME}
            unit="Case"
            index={index}
            total={total}
            points={normalizeScore(raw, perfectRaw)}
            streak={streak}
            multiplier={comboMultiplier(streak)}
            timeMs={timeMs}
            comboFlashKey={comboFlashKey}
          />
          <DetectiveQuestion
            key={index}
            exercise={exercises[index]}
            multiplier={comboMultiplier(streak)}
            perfectRaw={perfectRaw}
            onAnswered={handleAnswered}
          />
        </div>
      )}

      {/* Results */}
      {phase === 'done' && (
        <div className="text-center py-4">
          <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>
            {ratingFor(finalScore)}
          </p>
          <h2 style={{ fontSize: 44, fontWeight: 800, color: C.text, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
            {shownScore}
            <span style={{ fontSize: 20, color: C.muted }}> / 1000</span>
          </h2>

          <div className="flex items-center justify-center gap-3 mt-4 mb-2">
            <span
              className="ch-stamp-in"
              style={{
                display: 'inline-block',
                background: badge ? 'rgba(212,146,42,0.15)' : C.surface,
                color: badge ? C.accent : C.muted,
                border: `1px solid ${badge ? 'rgba(212,146,42,0.4)' : C.border}`,
                fontSize: 13,
                fontWeight: 700,
                padding: '5px 14px',
                borderRadius: 99,
              }}
            >
              {badgeLabel(badge)}
            </span>
            <span style={{ fontSize: 13, color: C.muted }}>Solved in {formatTime(elapsedMs)}</span>
            <span style={{ fontSize: 13, color: C.muted }}>Best streak {bestStreak}</span>
          </div>

          {isNewBest && finalScore > 0 && (
            <p style={{ fontSize: 13, fontWeight: 600, color: C.accent, marginTop: 6 }}>New personal best!</p>
          )}

          <div className="flex gap-3 justify-center mt-8">
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
              Play Again
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
