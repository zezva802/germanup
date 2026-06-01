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
const TIERS: [number, number, number] = [4000, 8000, 13000]; // recall time
const PARTIAL_PTS = 12;

const C = {
  bg: '#0a0a0f',
  surface: '#13131a',
  border: '#222230',
  text: '#e8e8f0',
  muted: '#50505f',
  accent: '#a78bfa',
  flash: '#ffffff',
  red: '#f87171',
};
const THEME = { accent: C.accent, text: C.text, muted: C.muted, surface: C.surface, border: C.border };
const MONO = "'Courier New', Courier, monospace";

function ratingFor(score: number): string {
  if (score >= 8000) return 'Photographic';
  if (score >= 5000) return 'Total recall';
  if (score >= 2500) return 'Sharp memory';
  if (score >= 1000) return 'Retained';
  return 'Faint signal';
}

const norm = (s: string) => s.trim().toLowerCase();
type Stage = 'ready' | 'flash' | 'recall' | 'result';

function buildSequence(exercises: Exercise[]): Exercise[] {
  const rank: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
  return [...exercises].sort(() => Math.random() - 0.5).sort((a, b) => (rank[a.difficulty] ?? 1) - (rank[b.difficulty] ?? 1));
}

// ─── One echo ───────────────────────────────────────────────────────────────────
function EchoQuestion({
  exercise,
  streakBefore,
  onAnswered,
}: {
  exercise: Exercise;
  streakBefore: number;
  onAnswered: (bothCorrect: boolean, pts: number) => void;
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
  const [gain, setGain] = useState(0);

  const recallStart = useRef(0);
  const input1Ref = useRef<HTMLInputElement>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage === 'ready') {
      const t = window.setTimeout(() => setStage('flash'), 500);
      return () => window.clearTimeout(t);
    }
    if (stage === 'flash') {
      playSound('click', 'echo');
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
    const base = endlessSpeedBase(Date.now() - recallStart.current, TIERS[0], TIERS[1], TIERS[2]);
    const pts = both ? Math.round(base * endlessMultiplier(streakBefore)) : one ? PARTIAL_PTS : 0;
    playSound(both ? 'correct' : 'wrong', 'echo');
    setGain(pts);
    setStage('result');
    window.setTimeout(() => onAnswered(both, pts), 1500);
  }

  function inputStyle(correct: boolean, done: boolean): React.CSSProperties {
    return {
      width: 'min(160px, 16ch)', fontSize: 18, textAlign: 'center', background: 'transparent',
      color: done ? (correct ? C.accent : C.red) : C.accent, border: 'none',
      borderBottom: `2px solid ${done ? (correct ? C.accent : C.red) : C.border}`, outline: 'none', margin: '0 4px',
    };
  }

  if (stage === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 220 }}>
        <ChallengeIcon slug="the-echo" size={32} color={C.muted} />
        <p style={{ color: C.muted, fontSize: 13, marginTop: 16, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: MONO }}>Intercepting…</p>
      </div>
    );
  }

  if (stage === 'flash') {
    return (
      <div className="flex items-center justify-center text-center" style={{ position: 'relative', minHeight: 220 }}>
        <span aria-hidden className="echo-ping" style={{ position: 'absolute', left: '50%', top: '50%', width: 140, height: 140, borderRadius: '50%', border: `2px solid ${C.accent}`, pointerEvents: 'none' }} />
        <p className="ch-fade-in" style={{ color: C.flash, fontSize: 23, fontWeight: 600, lineHeight: 1.5, textShadow: '0 0 32px rgba(167,139,250,0.55)' }}>{fullSentence}</p>
      </div>
    );
  }

  const done = stage === 'result';
  return (
    <div className="ch-fade-in" style={{ minHeight: 220 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, marginBottom: 16, fontFamily: MONO }}>
        Rebuild the transmission from memory
      </p>

      <div style={{ position: 'relative' }}>
        {done && gain > 0 && (
          <span className="ch-float-up" style={{ position: 'absolute', left: '50%', top: -12, fontSize: 13, fontWeight: 800, color: C.accent, pointerEvents: 'none', whiteSpace: 'nowrap' }}>+{gain}</span>
        )}
        <p style={{ fontSize: 18, lineHeight: 2.2, color: C.text }}>
          <span>{parts[0]}</span>
          <input
            ref={input1Ref}
            value={val1}
            onChange={(e) => setVal1(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (val1.trim()) input2Ref.current?.focus(); } }}
            disabled={done}
            spellCheck={false}
            autoComplete="off"
            className={done && c1 ? 'ch-mark' : undefined}
            style={inputStyle(c1, done)}
          />
          <span>{parts[1] ?? ' '}</span>
          <input
            ref={input2Ref}
            value={val2}
            onChange={(e) => setVal2(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
            disabled={done}
            spellCheck={false}
            autoComplete="off"
            className={done && c2 ? 'ch-mark' : undefined}
            style={inputStyle(c2, done)}
          />
          <span>{parts[2] ?? ''}</span>
        </p>
      </div>

      {done ? (
        <div className="mt-6">
          {(!c1 || !c2) && (
            <p style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>
              Answer: <span style={{ color: C.accent, fontWeight: 700 }}>{answers[0]}</span>{' … '}<span style={{ color: C.accent, fontWeight: 700 }}>{answers[1]}</span>
            </p>
          )}
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{exercise.explanation}</p>
        </div>
      ) : (
        <button
          onClick={submit}
          disabled={!val1.trim() || !val2.trim()}
          className="mt-6 w-full"
          style={{ padding: '10px 0', borderRadius: 12, fontWeight: 700, fontSize: 14, background: !val1.trim() || !val2.trim() ? C.border : C.accent, color: !val1.trim() || !val2.trim() ? C.muted : '#111', border: 'none', cursor: !val1.trim() || !val2.trim() ? 'default' : 'pointer' }}
        >
          Submit
        </button>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────
export default function TheEchoPage() {
  const { data: exercises = [], isLoading } = useExercises(
    { topic: 'the-echo', type: 'ECHO', limit: 60 },
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

  const det = results?.find((r) => r.challengeSlug === 'the-echo');
  const highScore = det?.bestScore ?? 0;
  const echoNo = String((det?.playsCount ?? 0) + 1).padStart(4, '0');
  const sequence = useMemo(() => buildSequence(exercises), [exercises, runId]);
  const hasData = sequence.length > 0;
  const current = hasData ? sequence[qIndex % sequence.length] : null;

  useEffect(() => {
    if (phase === 'over' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish', 'echo');
      saveResult.mutate({ challengeSlug: 'the-echo', score: finalScore });
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

  function handleAnswered(bothCorrect: boolean, pts: number) {
    const newScore = score + pts;
    setScore(newScore);
    if (bothCorrect) {
      const nextStreak = streak + 1;
      if (endlessMultiplier(nextStreak) > endlessMultiplier(streak)) {
        playSound('combo', 'echo');
        setComboFlashKey((k) => k + 1);
      }
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setSolved((n) => n + 1);
      setQIndex((i) => i + 1);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      if (newLives <= 0) {
        setFinalScore(newScore);
        setElapsedMs(Date.now() - pageStart.current);
        setPhase('over');
      } else {
        setQIndex((i) => i + 1);
      }
    }
  }

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}`, borderRadius: 18, maxWidth: 620, minHeight: 460, background: 'linear-gradient(165deg, #0f0d18 0%, #0a0a0f 45%, #050409 100%)', boxShadow: '0 24px 70px rgba(0,0,0,0.55)' }}
    >
      {/* Interception scene */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(110% 80% at 50% 32%, rgba(167,139,250,0.14), rgba(167,139,250,0.04) 45%, transparent 70%)' }} />
      <div
        aria-hidden
        className="radar-sweep"
        style={{ position: 'absolute', left: '50%', top: '46%', width: 760, height: 760, borderRadius: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none', opacity: 0.5, background: 'conic-gradient(from 0deg, rgba(167,139,250,0.16), rgba(167,139,250,0.02) 38deg, transparent 70deg)' }}
      />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 36%, transparent 44%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.76) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(167,139,250,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" style={{ color: C.accent }}>
            <ChallengeIcon slug="the-echo" size={16} color={C.accent} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: MONO }}>
              The Echo<span className="crt-cursor" style={{ color: C.accent }}>_</span>
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
            <p style={{ color: C.muted, marginBottom: 16 }}>No transmissions to echo yet. Check back soon.</p>
            <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>← Back to Challenges</Link>
          </div>
        )}

        {!isLoading && hasData && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-echo"
            kicker="Brief Interception"
            title="The Echo"
            tagline="Each transmission flashes for two seconds, then vanishes. Rebuild both missing words from memory — they keep coming, three misses end the watch."
            rules={[
              'Watch the 2-second flash, then type both missing words.',
              'Both right keeps your streak alive and multiplies your score.',
              'One right is partial credit but still a miss — three misses end the run.',
            ]}
            bestBadge={milestoneBadge(highScore)}
            bestScore={highScore || null}
            beginLabel="Begin Interception"
            onBegin={begin}
            titleFontFamily={MONO}
          />
        )}

        {!isLoading && hasData && phase === 'playing' && current && (
          <div>
            <EndlessHud {...THEME} lives={lives} maxLives={MAX_LIVES} score={score} streak={streak} multiplier={endlessMultiplier(streak)} timeMs={timeMs} comboFlashKey={comboFlashKey} />
            <EchoQuestion key={qIndex} exercise={current} streakBefore={streak} onAnswered={handleAnswered} />
          </div>
        )}

        {phase === 'over' && (
          <EndlessResults
            {...THEME}
            active
            score={finalScore}
            prevBest={prevBest ?? 0}
            rating={ratingFor(finalScore)}
            kicker={`Interception Nº ${echoNo} — Ended`}
            stats={[
              { label: 'Recalled', value: solved },
              { label: 'Best streak', value: bestStreak },
              { label: 'Survived', value: formatTime(elapsedMs) },
            ]}
            playAgainLabel="New Interception"
            onPlayAgain={begin}
          />
        )}
      </div>
    </div>
  );
}
