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
const TIERS: [number, number, number] = [12000, 24000, 40000];
const PASS_RATIO = 0.7;

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
  if (score >= 8000) return 'Cryptographer';
  if (score >= 5000) return 'Code breaker';
  if (score >= 2500) return 'Decrypted';
  if (score >= 1000) return 'Cipher cracked';
  return 'Signal lost';
}

// ─── One sort ───────────────────────────────────────────────────────────────────
function CipherSort({
  exercise,
  streakBefore,
  onDone,
}: {
  exercise: Exercise;
  streakBefore: number;
  onDone: (pass: boolean, perfect: boolean, pts: number) => void;
}) {
  const answerMap = useMemo(() => JSON.parse(exercise.answer) as Record<string, string>, [exercise.answer]);
  const items = useMemo(() => (exercise.options as string[] | null) ?? [], [exercise.options]);
  const categories = useMemo(() => [...new Set(Object.values(answerMap))], [answerMap]);

  const runStart = useRef(Date.now());
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [gain, setGain] = useState(0);

  const placedCount = items.filter((i) => assignments[i]).length;
  const allPlaced = placedCount === items.length && items.length > 0;
  const unplaced = items.filter((i) => !assignments[i]);

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

  useEffect(() => {
    if (submitted || !selected) return;
    function onKey(e: KeyboardEvent) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= categories.length) assign(selected!, categories[n - 1]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, submitted, categories]);

  function transmit() {
    if (!allPlaced || submitted) return;
    const correctCount = items.filter((i) => answerMap[i] === assignments[i]).length;
    const perfect = correctCount === items.length;
    const pass = correctCount / items.length >= PASS_RATIO;
    const speedBonus = endlessSpeedBase(Date.now() - runStart.current, TIERS[0], TIERS[1], TIERS[2]);
    const pts = Math.round(correctCount * 6 * endlessMultiplier(streakBefore)) + (perfect ? speedBonus : 0);
    setGain(pts);
    setSubmitted(true);
    playSound('click', 'cipher');
    playSound(pass ? 'correct' : 'wrong', 'cipher');
    window.setTimeout(() => onDone(pass, perfect, pts), 1100);
  }

  return (
    <div className="ch-fade-in">
      <div className="flex items-center justify-between mb-2" style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted }}>
        <span>&gt; Route every signal to its department</span>
        <span style={{ color: C.accent }}>{String(placedCount).padStart(2, '0')}/{String(items.length).padStart(2, '0')}</span>
      </div>

      <div className="flex flex-wrap gap-2 p-3 mb-6 rounded-lg" style={{ background: C.surface, border: `1px solid ${C.border}`, minHeight: 56, position: 'relative' }}>
        {unplaced.length === 0 ? (
          <span className="self-center w-full text-center" style={{ fontSize: 13, color: C.muted, fontFamily: MONO }}>All signals routed — transmit</span>
        ) : (
          unplaced.map((item) => {
            const isSel = selected === item;
            return (
              <button
                key={item}
                onClick={() => handleItemClick(item)}
                disabled={submitted}
                style={{ padding: '6px 12px', borderRadius: 8, fontSize: 14, fontWeight: 600, fontFamily: MONO, cursor: submitted ? 'default' : 'pointer', background: isSel ? C.accent : C.border, color: isSel ? C.bg : C.text, border: `1px solid ${isSel ? C.accent : C.border}`, boxShadow: isSel ? '0 0 14px rgba(34,197,94,0.5)' : 'none' }}
              >
                {item}
              </button>
            );
          })
        )}
        {submitted && gain > 0 && (
          <span className="ch-float-up" style={{ position: 'absolute', left: '50%', top: -4, fontSize: 13, fontWeight: 800, color: C.accent, pointerEvents: 'none', whiteSpace: 'nowrap' }}>+{gain}</span>
        )}
      </div>

      <div className="grid gap-3 mb-6" style={{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }}>
        {categories.map((category, ci) => {
          const inBucket = items.filter((i) => assignments[i] === category);
          return (
            <div
              key={category}
              onClick={() => handleBucketClick(category)}
              style={{ minHeight: 80, padding: 12, borderRadius: 10, background: C.surface, border: submitted ? `1px solid ${C.border}` : `1px dashed ${selected ? C.accent : C.border}`, cursor: !submitted && selected ? 'pointer' : 'default' }}
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
                      style={{ padding: '4px 10px', borderRadius: 7, fontSize: 13, fontWeight: 600, fontFamily: MONO, cursor: submitted ? 'default' : 'pointer', background: isRight ? 'rgba(34,197,94,0.18)' : isWrong ? 'rgba(248,113,113,0.18)' : C.border, color: isRight ? C.accent : isWrong ? C.red : C.text, border: `1px solid ${isRight ? 'rgba(34,197,94,0.4)' : isWrong ? 'rgba(248,113,113,0.4)' : C.border}` }}
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
          onClick={transmit}
          disabled={!allPlaced}
          className="w-full"
          style={{ padding: '11px 0', borderRadius: 12, fontWeight: 700, fontSize: 14, fontFamily: MONO, background: allPlaced ? C.accent : C.border, color: allPlaced ? C.bg : C.muted, border: 'none', cursor: allPlaced ? 'pointer' : 'default', letterSpacing: '0.1em', textTransform: 'uppercase', boxShadow: allPlaced ? '0 0 22px rgba(34,197,94,0.35)' : 'none' }}
        >
          {allPlaced ? '▸ Transmit' : `Route ${unplaced.length} more`}
        </button>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TheCipherPage() {
  const { data: exercises = [], isLoading } = useExercises(
    { topic: 'the-cipher', type: 'SORT', limit: 30 },
    true,
  );
  const { data: results } = useChallengeResults();
  const saveResult = useSaveChallengeResult();

  const [phase, setPhase] = useState<'intro' | 'playing' | 'over'>('intro');
  const [runId, setRunId] = useState(0);
  const [sortIndex, setSortIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [perfects, setPerfects] = useState(0);
  const [comboFlashKey, setComboFlashKey] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const pageStart = useRef(Date.now());
  const savedRef = useRef(false);
  const timeMs = useStopwatch(phase === 'playing', runId);

  const det = results?.find((r) => r.challengeSlug === 'the-cipher');
  const highScore = det?.bestScore ?? 0;
  const opNo = String((det?.playsCount ?? 0) + 1).padStart(4, '0');

  // Shuffled pool; pick by sortIndex (reshuffled each run).
  const pool = useMemo(() => [...exercises].sort(() => Math.random() - 0.5), [exercises, runId]);
  const hasData = pool.length > 0;
  const current = hasData ? pool[sortIndex % pool.length] : null;

  useEffect(() => {
    if (phase === 'over' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish', 'cipher');
      saveResult.mutate({ challengeSlug: 'the-cipher', score: finalScore });
    }
  }, [phase, finalScore, saveResult]);

  function begin() {
    resumeAudio();
    savedRef.current = false;
    setSortIndex(0);
    setScore(0);
    setLives(MAX_LIVES);
    setStreak(0);
    setBestStreak(0);
    setPerfects(0);
    setFinalScore(0);
    setElapsedMs(0);
    setPrevBest(highScore);
    pageStart.current = Date.now();
    setRunId((r) => r + 1);
    setPhase('playing');
  }

  function handleDone(pass: boolean, perfect: boolean, pts: number) {
    const newScore = score + pts;
    setScore(newScore);
    if (perfect) {
      const nextStreak = streak + 1;
      if (endlessMultiplier(nextStreak) > endlessMultiplier(streak)) {
        playSound('combo', 'cipher');
        setComboFlashKey((k) => k + 1);
      }
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setPerfects((n) => n + 1);
    } else {
      setStreak(0);
    }
    if (!pass) {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setFinalScore(newScore);
        setElapsedMs(Date.now() - pageStart.current);
        setPhase('over');
        return;
      }
    }
    setSortIndex((i) => i + 1);
  }

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 680, minHeight: 480, background: 'linear-gradient(165deg, #07160d 0%, #050f08 45%, #020704 100%)', boxShadow: '0 24px 70px rgba(0,0,0,0.55)' }}
    >
      {/* CRT terminal scene */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(120% 90% at 50% 30%, rgba(34,197,94,0.12), rgba(34,197,94,0.03) 45%, transparent 70%)' }} />
      <div aria-hidden className="crt-flicker" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'rgba(34,197,94,0.03)' }} />
      <div aria-hidden className="crt-sweep" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 80, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent, rgba(150,255,190,0.07), transparent)' }} />
      <div aria-hidden className="crt-scanlines" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 38%, transparent 42%, rgba(0,0,0,0.5) 80%, rgba(0,0,0,0.74) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(34,197,94,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
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

        {!isLoading && !hasData && (
          <div className="text-center py-12">
            <p style={{ color: C.muted, marginBottom: 16 }}>No signals to decrypt yet. Check back soon.</p>
            <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>← Back to Challenges</Link>
          </div>
        )}

        {!isLoading && hasData && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-cipher"
            kicker="Signals Intercepted"
            title="The Cipher"
            tagline="Route each burst of intercepted signals to its department. New bursts keep coming — botch a sort and you lose a channel; lose all three and the line goes dead."
            rules={[
              'Select a signal, then a department — or press its number key.',
              'A perfect sort builds your streak and multiplies your score; speed adds a bonus.',
              'Get most of a sort wrong and you lose a life. Three lost and the run is over.',
            ]}
            bestBadge={milestoneBadge(highScore)}
            bestScore={highScore || null}
            beginLabel="Open Channel"
            onBegin={begin}
            titleFontFamily={MONO}
          />
        )}

        {!isLoading && hasData && phase === 'playing' && current && (
          <div>
            <EndlessHud {...THEME} lives={lives} maxLives={MAX_LIVES} score={score} streak={streak} multiplier={endlessMultiplier(streak)} timeMs={timeMs} comboFlashKey={comboFlashKey} />
            <CipherSort key={sortIndex} exercise={current} streakBefore={streak} onDone={handleDone} />
          </div>
        )}

        {phase === 'over' && (
          <EndlessResults
            {...THEME}
            active
            score={finalScore}
            prevBest={prevBest ?? 0}
            rating={ratingFor(finalScore)}
            kicker={`Op Nº ${opNo} — Line Dead`}
            stats={[
              { label: 'Perfect sorts', value: perfects },
              { label: 'Best streak', value: bestStreak },
              { label: 'Survived', value: formatTime(elapsedMs) },
            ]}
            playAgainLabel="New Channel"
            onPlayAgain={begin}
          />
        )}
      </div>
    </div>
  );
}
