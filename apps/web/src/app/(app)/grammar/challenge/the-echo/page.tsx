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

// ─── Brief-interception palette (inline only) ──────────────────────────────────
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
  multiplier,
  perfectRaw,
  onAnswered,
}: {
  exercise: Exercise;
  multiplier: number;
  perfectRaw: number;
  onAnswered: (rec: EchoRecord, base: number, bothCorrect: boolean) => void;
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

  // Ready (500ms) → Flash (exactly 2000ms) → Recall
  useEffect(() => {
    if (stage === 'ready') {
      const t = window.setTimeout(() => setStage('flash'), 500);
      return () => window.clearTimeout(t);
    }
    if (stage === 'flash') {
      playSound('click', 'echo'); // brief interception ping
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
    const base = pointsForRecall(both, one, Date.now() - recallStart.current);
    playSound('click', 'echo');
    playSound(both || one ? 'correct' : 'wrong', 'echo');
    if (base > 0 && perfectRaw > 0) {
      setGain(Math.round(((base * (both ? multiplier : 1)) / perfectRaw) * 1000));
    }
    const rec: EchoRecord = { sentence: fullSentence, typed: [val1, val2], answers, c1: correct1, c2: correct2 };
    setStage('result');
    window.setTimeout(() => onAnswered(rec, base, both), 1500);
  }

  function inputStyle(correct: boolean, done: boolean): React.CSSProperties {
    return {
      width: 'min(160px, 16ch)',
      fontSize: 18,
      textAlign: 'center',
      background: 'transparent',
      color: done ? (correct ? C.accent : C.red) : C.accent,
      border: 'none',
      borderBottom: `2px solid ${done ? (correct ? C.accent : C.red) : C.border}`,
      outline: 'none',
      margin: '0 4px',
    };
  }

  // ── Ready ──
  if (stage === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 220 }}>
        <ChallengeIcon slug="the-echo" size={32} color={C.muted} />
        <p style={{ color: C.muted, fontSize: 13, marginTop: 16, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: MONO }}>
          Intercepting…
        </p>
      </div>
    );
  }

  // ── Flash ──
  if (stage === 'flash') {
    return (
      <div className="flex items-center justify-center text-center" style={{ position: 'relative', minHeight: 220 }}>
        <span
          aria-hidden
          className="echo-ping"
          style={{ position: 'absolute', left: '50%', top: '50%', width: 140, height: 140, borderRadius: '50%', border: `2px solid ${C.accent}`, pointerEvents: 'none' }}
        />
        <p className="ch-fade-in" style={{ color: C.flash, fontSize: 23, fontWeight: 600, lineHeight: 1.5, textShadow: '0 0 32px rgba(167,139,250,0.55)' }}>
          {fullSentence}
        </p>
      </div>
    );
  }

  // ── Recall / Result ──
  const done = stage === 'result';
  return (
    <div className="ch-fade-in" style={{ minHeight: 220 }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted, marginBottom: 16, fontFamily: MONO }}>
        Rebuild the transmission from memory
      </p>

      <div style={{ position: 'relative' }}>
        {done && gain > 0 && (
          <span
            className="ch-float-up"
            style={{ position: 'absolute', left: '50%', top: -12, fontSize: 13, fontWeight: 800, color: C.accent, pointerEvents: 'none', whiteSpace: 'nowrap' }}
          >
            +{gain}
          </span>
        )}
        <p style={{ fontSize: 18, lineHeight: 2.2, color: C.text }}>
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
            className={done && c1 ? 'ch-mark' : undefined}
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
  const perfectRaw = useMemo(() => perfectComboRaw(total), [total]);

  const [phase, setPhase] = useState<'intro' | 'playing' | 'done'>('intro');
  const [runId, setRunId] = useState(0);
  const [index, setIndex] = useState(0);
  const [raw, setRaw] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [comboFlashKey, setComboFlashKey] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [records, setRecords] = useState<EchoRecord[]>([]);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const savedRef = useRef(false);
  const timeMs = useStopwatch(phase === 'playing', runId);
  const shownScore = useCountUp(phase === 'done' ? finalScore : 0);

  const det = results?.find((r) => r.challengeSlug === 'the-echo');
  const bestRef = useRef<number | null>(null);
  bestRef.current = det?.bestScore ?? null;
  const echoNo = String((det?.playsCount ?? 0) + 1).padStart(4, '0');

  useEffect(() => {
    if (phase === 'done' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish', 'echo');
      saveResult.mutate({ challengeSlug: 'the-echo', score: finalScore });
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

  function handleAnswered(rec: EchoRecord, base: number, bothCorrect: boolean) {
    let gain = 0;
    if (bothCorrect) {
      gain = Math.round(base * comboMultiplier(streak));
      const nextStreak = streak + 1;
      if (comboMultiplier(nextStreak) > comboMultiplier(streak)) {
        playSound('combo', 'echo');
        setComboFlashKey((k) => k + 1);
      }
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
    } else {
      gain = base; // partial credit keeps its points but breaks the streak
      setStreak(0);
    }
    setRaw((p) => p + gain);
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
        maxWidth: 620,
        minHeight: 420,
        background: 'linear-gradient(165deg, #0f0d18 0%, #0a0a0f 45%, #050409 100%)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
      }}
    >
      {/* ── Interception scene: radar sweep, violet glow, vignette, faint grain ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(110% 80% at 50% 32%, rgba(167,139,250,0.14), rgba(167,139,250,0.04) 45%, transparent 70%)' }} />
      <div
        aria-hidden
        className="radar-sweep"
        style={{
          position: 'absolute', left: '50%', top: '46%', width: 760, height: 760, borderRadius: '50%',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none', opacity: 0.5,
          background: 'conic-gradient(from 0deg, rgba(167,139,250,0.16), rgba(167,139,250,0.02) 38deg, transparent 70deg)',
        }}
      />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 36%, transparent 44%, rgba(0,0,0,0.55) 80%, rgba(0,0,0,0.76) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06 }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(167,139,250,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" style={{ color: C.accent }}>
            <ChallengeIcon slug="the-echo" size={16} color={C.accent} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700, fontFamily: MONO }}>
              The Echo<span className="crt-cursor" style={{ color: C.accent }}>_</span>
            </span>
          </div>
          <SoundToggle accent={C.accent} muted={C.muted} />
        </div>

        {/* Interception strip */}
        {!isLoading && total > 0 && (
          <div
            className="flex items-center justify-between mb-6"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '6px 2px' }}
          >
            <span>Interception</span>
            <span style={{ color: C.accent, fontWeight: 700 }}>Nº {echoNo}</span>
          </div>
        )}

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

        {!isLoading && total > 0 && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-echo"
            kicker="Brief Interception"
            title="The Echo"
            tagline="Each transmission flashes for two seconds, then it's gone. Rebuild the two missing words from memory — and grammar."
            rules={[
              'Watch the sentence flash for exactly two seconds, then vanish.',
              'Type both missing words from memory — Tab between them, Enter to submit.',
              'Get both right in a row to build a streak; one right still earns partial credit.',
            ]}
            bestBadge={badgeFor(det?.bestScore ?? 0)}
            bestScore={det?.bestScore ?? null}
            beginLabel="Begin Interception"
            onBegin={begin}
            titleFontFamily={MONO}
          />
        )}

        {!isLoading && total > 0 && phase === 'playing' && (
          <div>
            <ChallengeHud
              {...THEME}
              unit="Echo"
              index={index}
              total={total}
              points={normalizeScore(raw, perfectRaw)}
              streak={streak}
              multiplier={comboMultiplier(streak)}
              timeMs={timeMs}
              comboFlashKey={comboFlashKey}
            />
            <EchoQuestion
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
              <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>
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
                  className="px-3 py-2.5"
                  style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.border}`, fontSize: 13 }}
                >
                  <p style={{ color: C.text, marginBottom: 4 }}>{r.sentence}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {[0, 1].map((b) => {
                      const ok = b === 0 ? r.c1 : r.c2;
                      return (
                        <span key={b} className="flex items-center gap-1.5">
                          <ResultMark ok={ok} okColor={C.accent} failColor={C.red} size={12} />
                          {ok ? (
                            <span style={{ color: C.accent }}>{r.answers[b]}</span>
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
    </div>
  );
}
