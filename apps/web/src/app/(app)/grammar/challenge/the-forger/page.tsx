'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Exercise } from '@germanup/types';
import { useExercises } from '@/hooks/use-exercises';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { useChallengeResults, useSaveChallengeResult } from '@/hooks/use-challenges';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';
import { EndlessHud } from '@/components/challenges/endless-hud';
import { EndlessResults } from '@/components/challenges/endless-results';
import { ChallengeIntro } from '@/components/challenges/challenge-intro';
import { SoundToggle } from '@/components/challenges/sound-toggle';
import { ResultMark } from '@/components/challenges/result-mark';
import { playSound, resumeAudio } from '@/lib/challenge-sound';
import { endlessMultiplier, endlessSpeedBase, formatTime, milestoneBadge } from '@/lib/challenge-scoring';

const MAX_LIVES = 3;
const TIERS: [number, number, number] = [4000, 8000, 13000];

const C = {
  bg: '#0d0b09',
  surface: '#161310',
  border: '#2e2820',
  text: '#ede8de',
  text2: '#7a6e60',
  english: '#5a9a6a',
  accent: '#c8a84b',
  inputBorder: '#3a3228',
  red: '#f87171',
};
const THEME = { accent: C.accent, text: C.text, muted: C.text2, surface: C.surface, border: C.border };
const MONO = "'Courier New', Courier, monospace";

function ratingFor(score: number): string {
  if (score >= 8000) return 'Master forger';
  if (score >= 5000) return 'Flawless hand';
  if (score >= 2500) return 'Convincing';
  if (score >= 1000) return 'Passable';
  return 'Detected';
}

const norm = (s: string) => s.trim().toLowerCase();

function buildSequence(exercises: Exercise[]): Exercise[] {
  const rank: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
  return [...exercises].sort(() => Math.random() - 0.5).sort((a, b) => (rank[a.difficulty] ?? 1) - (rank[b.difficulty] ?? 1));
}

// ─── One document (one fill-blank) ──────────────────────────────────────────────
function ForgerQuestion({
  exercise,
  streakBefore,
  onAnswered,
}: {
  exercise: Exercise;
  streakBefore: number;
  onAnswered: (correct: boolean, pts: number) => void;
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
  const [gain, setGain] = useState(0);

  function setValue(i: number, v: string) {
    setValues((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  }

  function checkCorrect(): boolean {
    if (expected.length === blankCount) return values.every((v, i) => norm(v) === norm(expected[i]));
    return norm(values.join(' ')) === norm(exercise.answer.replace(/\.\.\./g, ' '));
  }

  function submit() {
    if (submitted || values.some((v) => !v.trim())) return;
    const isCorrect = checkCorrect();
    const base = endlessSpeedBase(Date.now() - startRef.current, TIERS[0], TIERS[1], TIERS[2]);
    const pts = isCorrect ? Math.round(base * endlessMultiplier(streakBefore)) : 0;
    playSound(isCorrect ? 'correct' : 'wrong', 'forger');
    setGain(pts);
    setCorrect(isCorrect);
    setSubmitted(true);
    window.setTimeout(() => onAnswered(isCorrect, pts), 1200);
  }

  const borderColor = submitted ? (correct ? C.accent : C.red) : C.inputBorder;

  return (
    <div className="ch-fade-in" style={{ position: 'relative' }}>
      {submitted && (
        <div
          className="ch-stamp-in"
          aria-hidden
          style={{ position: 'absolute', top: -8, right: -2, transform: 'rotate(-11deg)', border: `2.5px solid ${correct ? C.accent : C.red}`, color: correct ? C.accent : C.red, borderRadius: 6, padding: '2px 10px', fontFamily: MONO, fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', opacity: 0.85, pointerEvents: 'none' }}
        >
          {correct ? 'FORGED' : 'VOID'}
        </div>
      )}
      {english && <p style={{ color: C.english, fontStyle: 'italic', fontSize: 15, marginBottom: 18 }}>{english}</p>}

      <p style={{ fontFamily: MONO, fontSize: 18, lineHeight: 2, color: C.text }}>
        {parts.map((part, i) => (
          <span key={i}>
            <span>{part}</span>
            {i < parts.length - 1 && (
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <input
                  autoFocus={i === 0}
                  value={values[i]}
                  onChange={(e) => {
                    if (e.target.value.length > values[i].length) playSound('click', 'forger');
                    setValue(i, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submit();
                  }}
                  disabled={submitted}
                  spellCheck={false}
                  autoComplete="off"
                  className={submitted && correct ? 'ch-mark' : undefined}
                  style={{ fontFamily: MONO, fontSize: 18, width: 'min(180px, 20ch)', background: 'transparent', color: submitted ? (correct ? C.accent : C.red) : C.accent, border: 'none', borderBottom: `2px solid ${borderColor}`, outline: 'none', textAlign: 'center', margin: '0 4px' }}
                />
                {submitted && correct && i === 0 && gain > 0 && (
                  <span className="ch-float-up" style={{ position: 'absolute', left: '50%', top: -10, fontSize: 13, fontWeight: 800, color: C.accent, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                    +{gain}
                  </span>
                )}
              </span>
            )}
          </span>
        ))}
      </p>

      {submitted && (
        <div className="flex items-start gap-2 mt-6">
          <ResultMark ok={correct} okColor={C.accent} failColor={C.red} size={16} />
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

      {!submitted && <p style={{ fontSize: 12, color: C.text2, marginTop: 20 }}>Press Enter to forge</p>}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TheForgerPage() {
  const { data: exercises = [], isLoading } = useExercises(
    { topic: 'the-forger', type: 'FILL_BLANK', limit: 100 },
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

  const det = results?.find((r) => r.challengeSlug === 'the-forger');
  const highScore = det?.bestScore ?? 0;
  const docNo = String((det?.playsCount ?? 0) + 1).padStart(4, '0');
  const sequence = useMemo(() => buildSequence(exercises), [exercises, runId]);
  const hasData = sequence.length > 0;
  const current = hasData ? sequence[qIndex % sequence.length] : null;

  useEffect(() => {
    if (phase === 'over' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish', 'forger');
      saveResult.mutate({ challengeSlug: 'the-forger', score: finalScore });
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

  function handleAnswered(correct: boolean, pts: number) {
    if (correct) {
      const nextStreak = streak + 1;
      if (endlessMultiplier(nextStreak) > endlessMultiplier(streak)) {
        playSound('combo', 'forger');
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
        setFinalScore(score);
        setElapsedMs(Date.now() - pageStart.current);
        setPhase('over');
      } else {
        setQIndex((i) => i + 1);
      }
    }
  }

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 640, minHeight: 480, background: 'linear-gradient(165deg, #14100b 0%, #0d0b09 45%, #070503 100%)', boxShadow: '0 24px 70px rgba(0,0,0,0.55)' }}
    >
      {/* Forgery-desk scene */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(110% 80% at 50% -8%, rgba(200,168,75,0.22), rgba(200,168,75,0.05) 40%, transparent 62%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 27px, rgba(237,232,222,0.03) 27px, rgba(237,232,222,0.03) 28px)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 36%, transparent 42%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0.68) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(200,168,75,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" style={{ color: C.accent }}>
            <ChallengeIcon slug="the-forger" size={16} color={C.accent} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>The Forger</span>
          </div>
          <SoundToggle accent={C.accent} muted={C.text2} />
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.accent }} />
          </div>
        )}

        {!isLoading && !hasData && (
          <div className="text-center py-12">
            <p style={{ color: C.text2, marginBottom: 16 }}>No documents to forge yet. Check back soon.</p>
            <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>← Back to Challenges</Link>
          </div>
        )}

        {!isLoading && hasData && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-forger"
            kicker="Commission"
            title="The Forger"
            tagline="Forge the missing word into each document, in flawless German, from memory. The longer your run, the harder the papers — three rejects and the commission is off."
            rules={[
              'Type the exact missing word and press Enter.',
              'Speed and an unbroken hand multiply your score — no ceiling.',
              'Three rejected forgeries end the run. How high can you go?',
            ]}
            bestBadge={milestoneBadge(highScore)}
            bestScore={highScore || null}
            beginLabel="Take the Commission"
            onBegin={begin}
            titleFontFamily={MONO}
          />
        )}

        {!isLoading && hasData && phase === 'playing' && current && (
          <div>
            <EndlessHud {...THEME} lives={lives} maxLives={MAX_LIVES} score={score} streak={streak} multiplier={endlessMultiplier(streak)} timeMs={timeMs} comboFlashKey={comboFlashKey} />
            <ForgerQuestion key={qIndex} exercise={current} streakBefore={streak} onAnswered={handleAnswered} />
          </div>
        )}

        {phase === 'over' && (
          <EndlessResults
            {...THEME}
            active
            score={finalScore}
            prevBest={prevBest ?? 0}
            rating={ratingFor(finalScore)}
            kicker={`Document Nº ${docNo} — Filed`}
            stats={[
              { label: 'Forged', value: solved },
              { label: 'Best streak', value: bestStreak },
              { label: 'Survived', value: formatTime(elapsedMs) },
            ]}
            playAgainLabel="New Commission"
            onPlayAgain={begin}
          />
        )}
      </div>
    </div>
  );
}
