'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@germanup/types';
import { useExercises } from '@/hooks/use-exercises';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { useCountUp } from '@/hooks/use-count-up';
import { useChallengeResults, useSaveChallengeResult } from '@/hooks/use-challenges';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';
import { EndlessHud } from '@/components/challenges/endless-hud';
import { ChallengeIntro } from '@/components/challenges/challenge-intro';
import { SoundToggle } from '@/components/challenges/sound-toggle';
import { playSound, resumeAudio } from '@/lib/challenge-sound';
import { badgeLabel, endlessMultiplier, endlessSpeedBase, formatTime, milestoneBadge } from '@/lib/challenge-scoring';

const MAX_LIVES = 3;
// Speed tiers for endless (ms) — tighter than the old fixed run.
const TIERS: [number, number, number] = [3000, 6000, 10000];

// ─── Noir palette (inline only) ────────────────────────────────────────────────
const C = {
  bg: '#0a0806',
  surface: '#12100d',
  border: '#2a2318',
  text: '#f0e8d8',
  muted: '#8a7560',
  accent: '#d4922a',
  red: '#f87171',
};
const THEME = { accent: C.accent, text: C.text, muted: C.muted, surface: C.surface, border: C.border };
const MONO = "'Courier New', Courier, monospace";

function ratingFor(score: number): string {
  if (score >= 8000) return 'Legendary detective';
  if (score >= 5000) return 'Master sleuth';
  if (score >= 2500) return 'Sharp eye';
  if (score >= 1000) return 'On the trail';
  return 'Case gone cold';
}

const clean = (w: string) => w.replace(/[.,!?;:]/g, '').toLowerCase();

// Order exercises easy → medium → hard (shuffled within each tier) for escalation.
function buildSequence(exercises: Exercise[]): Exercise[] {
  const rank: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
  const shuffled = [...exercises].sort(() => Math.random() - 0.5);
  return shuffled.sort((a, b) => (rank[a.difficulty] ?? 1) - (rank[b.difficulty] ?? 1));
}

// ─── A single interrogation (one sentence) ─────────────────────────────────────
function DetectiveQuestion({
  exercise,
  streakBefore,
  onAnswered,
}: {
  exercise: Exercise;
  streakBefore: number;
  onAnswered: (correct: boolean, pts: number) => void;
}) {
  const words = useMemo(() => exercise.question.split(' ').filter(Boolean), [exercise.question]);
  const wrongWordClean = clean((exercise.options as string[] | null)?.[0] ?? '');

  const startRef = useRef(Date.now());
  const [clickedIdx, setClickedIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gain, setGain] = useState(0);

  const elapsed = useStopwatch(!submitted);
  const worth = Math.round(endlessSpeedBase(elapsed, TIERS[0], TIERS[1], TIERS[2]) * endlessMultiplier(streakBefore));
  const barPct = submitted ? 0 : Math.max(0, 100 - (elapsed / 10000) * 100);

  function handleClick(i: number) {
    if (submitted) return;
    const isCorrect = clean(words[i]) === wrongWordClean;
    const base = endlessSpeedBase(Date.now() - startRef.current, TIERS[0], TIERS[1], TIERS[2]);
    const pts = isCorrect ? Math.round(base * endlessMultiplier(streakBefore)) : 0;
    playSound('click');
    playSound(isCorrect ? 'correct' : 'wrong');
    setGain(pts);
    setClickedIdx(i);
    setSubmitted(true);
    window.setTimeout(() => onAnswered(isCorrect, pts), 650);
  }

  return (
    <div className="ch-fade-in">
      {/* Live worth meter */}
      <div className="flex items-center justify-between mb-2" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
        <span style={{ color: C.muted, textTransform: 'uppercase' }}>Crack it for</span>
        <span style={{ color: worth >= 70 ? C.accent : C.muted, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
          {worth} pts
        </span>
      </div>
      <div className="h-0.5 rounded-full overflow-hidden mb-6" style={{ background: C.border }}>
        <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: C.accent, transition: 'width 0.2s linear', opacity: 0.5 + barPct / 200 }} />
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
            style = { ...style, background: 'rgba(212,146,42,0.16)', color: '#f2c277', boxShadow: '0 0 18px rgba(212,146,42,0.4)', textDecoration: 'underline', textDecorationColor: C.accent, textDecorationStyle: 'wavy', textUnderlineOffset: 4 };
            cls = 'ch-mark';
          } else if (isWrongClick) {
            style = { ...style, background: 'rgba(248,113,113,0.14)', color: C.red, textDecoration: 'line-through', textDecorationColor: C.red };
            cls = 'ch-nudge';
          }
          return (
            <span key={i}>
              {i > 0 && ' '}
              <span onClick={() => handleClick(i)} style={style} className={cls}>
                {word}
                {submitted && i === clickedIdx && isTarget && gain > 0 && (
                  <span className="ch-float-up" style={{ position: 'absolute', left: '50%', top: -4, fontSize: 13, fontWeight: 800, color: C.accent, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
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
  const { data: exercises = [], isLoading } = useExercises(
    { topic: 'the-detective', type: 'ERROR_SPOT', limit: 100 },
    true,
  );
  const { data: results } = useChallengeResults();
  const saveResult = useSaveChallengeResult();

  const [phase, setPhase] = useState<'intro' | 'playing' | 'over'>('intro');
  const [runId, setRunId] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [comboFlashKey, setComboFlashKey] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const pageStart = useRef(Date.now());
  const savedRef = useRef(false);
  const timeMs = useStopwatch(phase === 'playing', runId);
  const shownScore = useCountUp(phase === 'over' ? finalScore : 0);

  const det = results?.find((r) => r.challengeSlug === 'the-detective');
  const highScore = det?.bestScore ?? 0;
  const sequence = useMemo(() => buildSequence(exercises), [exercises, runId]);
  const hasData = sequence.length > 0;
  const current = hasData ? sequence[qIndex % sequence.length] : null;

  useEffect(() => {
    if (phase === 'over' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish');
      saveResult.mutate({ challengeSlug: 'the-detective', score: finalScore });
    }
  }, [phase, finalScore, saveResult]);

  function begin() {
    resumeAudio();
    savedRef.current = false;
    setQIndex(0);
    setScore(0);
    setLives(MAX_LIVES);
    setStreak(0);
    setBestStreak(0);
    setSolved(0);
    setFinalScore(0);
    setElapsedMs(0);
    setPrevBest(highScore);
    pageStart.current = Date.now();
    setRunId((r) => r + 1);
    setPhase('playing');
  }

  function endRun(finalPts: number) {
    setFinalScore(finalPts);
    setElapsedMs(Date.now() - pageStart.current);
    setPhase('over');
  }

  function handleAnswered(correct: boolean, pts: number) {
    if (correct) {
      const nextStreak = streak + 1;
      if (endlessMultiplier(nextStreak) > endlessMultiplier(streak)) {
        playSound('combo');
        setComboFlashKey((k) => k + 1);
      }
      setScore((s) => s + pts);
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setSolved((n) => n + 1);
      setQIndex((i) => i + 1);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      if (newLives <= 0) {
        endRun(score);
      } else {
        setQIndex((i) => i + 1);
      }
    }
  }

  const badge = milestoneBadge(finalScore);
  const isNewBest = phase === 'over' && finalScore > (prevBest ?? 0);
  const playsCount = det?.playsCount ?? 0;
  const caseNo = String(playsCount + 1).padStart(4, '0');

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        maxWidth: 640,
        minHeight: 480,
        background: 'linear-gradient(165deg, #100c08 0%, #0a0806 45%, #050403 100%)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
      }}
    >
      {/* Noir scene */}
      <div aria-hidden className="noir-lamp-flicker" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 85% at 50% -16%, rgba(212,146,42,0.32), rgba(212,146,42,0.07) 36%, transparent 58%)' }} />
      <div aria-hidden className="noir-blinds" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 34%, transparent 40%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0.72) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(212,146,42,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
        <style>{`.detective-word:hover { text-decoration: underline; text-decoration-color: ${C.accent}; }`}</style>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" style={{ color: C.accent }}>
            <ChallengeIcon slug="the-detective" size={16} color={C.accent} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>The Detective</span>
          </div>
          <SoundToggle accent={C.accent} muted={C.muted} />
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.accent }} />
          </div>
        )}

        {!isLoading && !hasData && (
          <div className="text-center py-12">
            <p style={{ color: C.muted, marginBottom: 16 }}>No cases on file yet. Check back soon.</p>
            <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>← Back to Challenges</Link>
          </div>
        )}

        {/* Intro */}
        {!isLoading && hasData && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-detective"
            kicker="Case File"
            title="The Detective"
            tagline="Every statement hides one grammatical lie. Crack cases as fast as you can — one slip costs a life, and three slips close the file for good."
            rules={[
              'Click the single wrong word in each statement.',
              'Speed and back-to-back solves multiply your score — there is no ceiling.',
              'Three wrong calls and the run is over. How high can you go?',
            ]}
            bestBadge={milestoneBadge(highScore)}
            bestScore={highScore || null}
            beginLabel="Open the Case File"
            onBegin={begin}
            titleFontFamily="Georgia, 'Times New Roman', serif"
          />
        )}

        {/* Playing */}
        {!isLoading && hasData && phase === 'playing' && current && (
          <div>
            <EndlessHud
              {...THEME}
              lives={lives}
              maxLives={MAX_LIVES}
              score={score}
              streak={streak}
              multiplier={endlessMultiplier(streak)}
              timeMs={timeMs}
              comboFlashKey={comboFlashKey}
            />
            <DetectiveQuestion key={qIndex} exercise={current} streakBefore={streak} onAnswered={handleAnswered} />
          </div>
        )}

        {/* Game over */}
        {phase === 'over' && (
          <div className="text-center py-4">
            <p style={{ fontSize: 11, fontFamily: MONO, letterSpacing: '0.25em', textTransform: 'uppercase', color: C.red, marginBottom: 10 }}>
              Case Nº {caseNo} — Closed
            </p>
            <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>
              {ratingFor(finalScore)}
            </p>
            <h2 style={{ fontSize: 46, fontWeight: 800, color: C.text, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {shownScore.toLocaleString()}
            </h2>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>POINTS</p>

            <div className="flex items-center justify-center gap-3 mt-4 mb-2">
              <span
                className="ch-stamp-in"
                style={{ display: 'inline-block', background: badge ? 'rgba(212,146,42,0.15)' : C.surface, color: badge ? C.accent : C.muted, border: `1px solid ${badge ? 'rgba(212,146,42,0.4)' : C.border}`, fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 99 }}
              >
                {badgeLabel(badge)}
              </span>
              <span style={{ fontSize: 13, color: C.muted }}>{solved} solved</span>
              <span style={{ fontSize: 13, color: C.muted }}>Best streak {bestStreak}</span>
              <span style={{ fontSize: 13, color: C.muted }}>Survived {formatTime(elapsedMs)}</span>
            </div>

            {isNewBest ? (
              <p style={{ fontSize: 14, fontWeight: 700, color: C.accent, marginTop: 8 }}>New high score!</p>
            ) : (
              <p style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>High score: {highScore.toLocaleString()}</p>
            )}

            <div className="flex gap-3 justify-center mt-8">
              <Link href="/grammar/challenges" style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, background: C.surface, color: C.muted, border: `1px solid ${C.border}`, textDecoration: 'none' }}>
                Back to Challenges
              </Link>
              <button onClick={begin} style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: C.accent, color: '#111', border: 'none', cursor: 'pointer' }}>
                New Case
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
