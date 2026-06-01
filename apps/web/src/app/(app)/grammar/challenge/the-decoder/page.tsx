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
import { playSound, resumeAudio } from '@/lib/challenge-sound';
import { endlessMultiplier, endlessSpeedBase, formatTime, milestoneBadge } from '@/lib/challenge-scoring';

const MAX_LIVES = 3;
const TIERS: [number, number, number] = [5000, 10000, 16000];

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
  if (score >= 8000) return 'Signal mastered';
  if (score >= 5000) return 'Clear channel';
  if (score >= 2500) return 'Decoded';
  if (score >= 1000) return 'Static cleared';
  return 'Lost in noise';
}

interface Tile {
  word: string;
  key: number;
}

function buildSequence(exercises: Exercise[]): Exercise[] {
  const rank: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
  return [...exercises].sort(() => Math.random() - 0.5).sort((a, b) => (rank[a.difficulty] ?? 1) - (rank[b.difficulty] ?? 1));
}

// ─── One transmission ──────────────────────────────────────────────────────────
function DecoderQuestion({
  exercise,
  streakBefore,
  onAnswered,
}: {
  exercise: Exercise;
  streakBefore: number;
  onAnswered: (correct: boolean, pts: number) => void;
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
    playSound('click', 'decoder');
    setPlaced((prev) => [...prev, key]);
  }
  function removeTile(key: number) {
    if (submitted) return;
    playSound('click', 'decoder');
    setPlaced((prev) => prev.filter((k) => k !== key));
  }
  function undo() {
    if (submitted || placed.length === 0) return;
    playSound('click', 'decoder');
    setPlaced((prev) => prev.slice(0, -1));
  }

  function decode() {
    if (submitted) return;
    const isCorrect = built === exercise.answer;
    const base = endlessSpeedBase(Date.now() - startRef.current, TIERS[0], TIERS[1], TIERS[2]);
    const pts = isCorrect ? Math.round(base * endlessMultiplier(streakBefore)) : 0;
    playSound('click', 'decoder');
    playSound(isCorrect ? 'correct' : 'wrong', 'decoder');
    setGain(pts);
    setCorrect(isCorrect);
    setSubmitted(true);
    window.setTimeout(() => onAnswered(isCorrect, pts), 1500);
  }

  return (
    <div className="ch-fade-in">
      <p style={{ fontSize: 14, color: C.muted, marginBottom: 18, fontFamily: MONO }}>
        &gt; Decode: <span style={{ color: C.text }}>&ldquo;{exercise.question}&rdquo;</span>
      </p>

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
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: MONO, cursor: submitted ? 'default' : 'pointer', background: submitted ? (correct ? 'rgba(96,165,250,0.18)' : 'rgba(248,113,113,0.18)') : C.accent, color: submitted ? (correct ? C.accent : C.red) : C.bg, border: `1px solid ${submitted ? (correct ? 'rgba(96,165,250,0.4)' : 'rgba(248,113,113,0.4)') : C.accent}` }}
              >
                {tiles[key].word}
              </button>
            ))
          )}
        </div>
        {submitted && correct && gain > 0 && (
          <span className="ch-float-up" style={{ position: 'absolute', left: '50%', top: 0, fontSize: 13, fontWeight: 800, color: C.accent, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            +{gain}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-5" style={{ minHeight: 40 }}>
        {tiles.map((t) => {
          const used = placedSet.has(t.key);
          return (
            <button
              key={t.key}
              onClick={() => placeTile(t.key)}
              disabled={submitted || used}
              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: MONO, cursor: submitted || used ? 'default' : 'pointer', opacity: used ? 0.25 : 1, background: C.tile, color: C.text, border: `1px solid ${C.tileBorder}` }}
            >
              {t.word}
            </button>
          );
        })}
      </div>

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
            style={{ padding: '10px 16px', borderRadius: 12, fontSize: 14, fontWeight: 600, fontFamily: MONO, background: C.surface, color: C.muted, border: `1px solid ${C.border}`, cursor: placed.length === 0 ? 'default' : 'pointer', opacity: placed.length === 0 ? 0.5 : 1 }}
          >
            ← Undo
          </button>
          <button
            onClick={decode}
            disabled={placed.length === 0}
            className="flex-1"
            style={{ padding: '10px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: MONO, letterSpacing: '0.08em', textTransform: 'uppercase', background: placed.length === 0 ? C.border : C.accent, color: placed.length === 0 ? C.muted : C.bg, border: 'none', cursor: placed.length === 0 ? 'default' : 'pointer', boxShadow: placed.length === 0 ? 'none' : '0 0 22px rgba(96,165,250,0.3)' }}
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
  const { data: exercises = [], isLoading } = useExercises(
    { topic: 'the-decoder', type: 'BUILD', limit: 60 },
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

  const det = results?.find((r) => r.challengeSlug === 'the-decoder');
  const highScore = det?.bestScore ?? 0;
  const interceptNo = String((det?.playsCount ?? 0) + 1).padStart(4, '0');
  const sequence = useMemo(() => buildSequence(exercises), [exercises, runId]);
  const hasData = sequence.length > 0;
  const current = hasData ? sequence[qIndex % sequence.length] : null;

  useEffect(() => {
    if (phase === 'over' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish', 'decoder');
      saveResult.mutate({ challengeSlug: 'the-decoder', score: finalScore });
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
        playSound('combo', 'decoder');
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
      style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 660, minHeight: 480, background: 'linear-gradient(165deg, #0b0f1e 0%, #080a12 45%, #04060e 100%)', boxShadow: '0 24px 70px rgba(0,0,0,0.55)' }}
    >
      {/* Transmission scene */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 90% at 50% 28%, rgba(96,165,250,0.13), rgba(96,165,250,0.03) 45%, transparent 70%)' }} />
      <div aria-hidden className="crt-flicker" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'rgba(96,165,250,0.025)' }} />
      <div aria-hidden className="signal-wave" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.2 }} />
      <div aria-hidden className="crt-scanlines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.7 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 36%, transparent 42%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.72) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(96,165,250,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" style={{ color: C.accent }}>
            <ChallengeIcon slug="the-decoder" size={16} color={C.accent} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: MONO }}>
              The Decoder<span className="crt-cursor" style={{ color: C.accent }}>_</span>
            </span>
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
            <p style={{ color: C.muted, marginBottom: 16 }}>No transmissions intercepted yet. Check back soon.</p>
            <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>← Back to Challenges</Link>
          </div>
        )}

        {!isLoading && hasData && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-decoder"
            kicker="Incoming Transmission"
            title="The Decoder"
            tagline="Reassemble scrambled signals into the correct sentence — decoys mixed in. Signals keep coming, harder each time; three failed decodes end the intercept."
            rules={[
              'Tap fragments to build the sentence; some are decoys.',
              'Speed and back-to-back decodes multiply your score — no ceiling.',
              'Three wrong decodes end the run. Push your high score.',
            ]}
            bestBadge={milestoneBadge(highScore)}
            bestScore={highScore || null}
            beginLabel="Lock Onto Signal"
            onBegin={begin}
            titleFontFamily={MONO}
          />
        )}

        {!isLoading && hasData && phase === 'playing' && current && (
          <div>
            <EndlessHud {...THEME} lives={lives} maxLives={MAX_LIVES} score={score} streak={streak} multiplier={endlessMultiplier(streak)} timeMs={timeMs} comboFlashKey={comboFlashKey} />
            <DecoderQuestion key={qIndex} exercise={current} streakBefore={streak} onAnswered={handleAnswered} />
          </div>
        )}

        {phase === 'over' && (
          <EndlessResults
            {...THEME}
            active
            score={finalScore}
            prevBest={prevBest ?? 0}
            rating={ratingFor(finalScore)}
            kicker={`Intercept Nº ${interceptNo} — Ended`}
            stats={[
              { label: 'Decoded', value: solved },
              { label: 'Best streak', value: bestStreak },
              { label: 'Survived', value: formatTime(elapsedMs) },
            ]}
            playAgainLabel="New Intercept"
            onPlayAgain={begin}
          />
        )}
      </div>
    </div>
  );
}
