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
import { badgeFor, badgeLabel, comboMultiplier, formatTime, normalizeScore, perfectComboRaw } from '@/lib/challenge-scoring';

// ─── Forged-document palette (inline only) ─────────────────────────────────────
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
  if (score >= 920) return 'Flawless forgery';
  if (score >= 800) return 'Convincing';
  if (score >= 650) return 'Passable';
  if (score >= 500) return 'Smudged ink';
  return 'Detected';
}

function pointsForTime(timeMs: number): number {
  if (timeMs < 8000) return 100;
  if (timeMs < 15000) return 80;
  if (timeMs < 25000) return 60;
  return 40;
}

const norm = (s: string) => s.trim().toLowerCase();

interface ForgerRecord {
  english: string;
  question: string;
  typed: string[];
  expected: string[];
  correct: boolean;
  timeMs: number;
}

// ─── One document (one fill-blank sentence) ────────────────────────────────────
function ForgerQuestion({
  exercise,
  multiplier,
  perfectRaw,
  onAnswered,
}: {
  exercise: Exercise;
  multiplier: number;
  perfectRaw: number;
  onAnswered: (rec: ForgerRecord) => void;
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
    if (expected.length === blankCount) {
      return values.every((v, i) => norm(v) === norm(expected[i]));
    }
    return norm(values.join(' ')) === norm(exercise.answer.replace(/\.\.\./g, ' '));
  }

  function submit() {
    if (submitted || values.some((v) => !v.trim())) return;
    const isCorrect = checkCorrect();
    const timeMs = Date.now() - startRef.current;
    playSound(isCorrect ? 'correct' : 'wrong', 'forger');
    if (isCorrect && perfectRaw > 0) {
      setGain(Math.round(((pointsForTime(timeMs) * multiplier) / perfectRaw) * 1000));
    }
    setCorrect(isCorrect);
    setSubmitted(true);
    window.setTimeout(
      () => onAnswered({ english, question: exercise.question, typed: values, expected, correct: isCorrect, timeMs }),
      1200,
    );
  }

  const borderColor = submitted ? (correct ? C.accent : C.red) : C.inputBorder;

  return (
    <div className="ch-fade-in" style={{ position: 'relative' }}>
      {submitted && (
        <div
          className="ch-stamp-in"
          aria-hidden
          style={{
            position: 'absolute', top: -8, right: -2, transform: 'rotate(-11deg)',
            border: `2.5px solid ${correct ? C.accent : C.red}`, color: correct ? C.accent : C.red,
            borderRadius: 6, padding: '2px 10px', fontFamily: MONO, fontWeight: 800, fontSize: 15,
            letterSpacing: '0.12em', opacity: 0.85, pointerEvents: 'none',
          }}
        >
          {correct ? 'FORGED' : 'VOID'}
        </div>
      )}
      {english && (
        <p style={{ color: C.english, fontStyle: 'italic', fontSize: 15, marginBottom: 18 }}>{english}</p>
      )}

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
                  style={{
                    fontFamily: MONO,
                    fontSize: 18,
                    width: 'min(180px, 20ch)',
                    background: 'transparent',
                    color: submitted ? (correct ? C.accent : C.red) : C.accent,
                    border: 'none',
                    borderBottom: `2px solid ${borderColor}`,
                    outline: 'none',
                    textAlign: 'center',
                    margin: '0 4px',
                  }}
                />
                {submitted && correct && i === 0 && gain > 0 && (
                  <span
                    className="ch-float-up"
                    style={{ position: 'absolute', left: '50%', top: -10, fontSize: 13, fontWeight: 800, color: C.accent, pointerEvents: 'none', whiteSpace: 'nowrap' }}
                  >
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
  const { data: exercises = [], isLoading, refetch } = useExercises(
    { topic: 'the-forger', type: 'FILL_BLANK', limit: 10 },
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
  const [records, setRecords] = useState<ForgerRecord[]>([]);
  const [prevBest, setPrevBest] = useState<number | null>(null);

  const savedRef = useRef(false);
  const timeMs = useStopwatch(phase === 'playing', runId);
  const shownScore = useCountUp(phase === 'done' ? finalScore : 0);

  const det = results?.find((r) => r.challengeSlug === 'the-forger');
  const bestRef = useRef<number | null>(null);
  bestRef.current = det?.bestScore ?? null;
  const docNo = String((det?.playsCount ?? 0) + 1).padStart(4, '0');

  useEffect(() => {
    if (phase === 'done' && !savedRef.current) {
      savedRef.current = true;
      playSound('finish', 'forger');
      saveResult.mutate({ challengeSlug: 'the-forger', score: finalScore });
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

  function handleAnswered(rec: ForgerRecord) {
    let gain = 0;
    let nextStreak = 0;
    if (rec.correct) {
      gain = Math.round(pointsForTime(rec.timeMs) * comboMultiplier(streak));
      nextStreak = streak + 1;
      if (comboMultiplier(nextStreak) > comboMultiplier(streak)) {
        playSound('combo', 'forger');
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
        maxWidth: 640,
        minHeight: 440,
        background: 'linear-gradient(165deg, #14100b 0%, #0d0b09 45%, #070503 100%)',
        boxShadow: '0 24px 70px rgba(0,0,0,0.55)',
      }}
    >
      {/* ── Forgery-desk scene: lamp glow, ruled paper, vignette, paper grain ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(110% 80% at 50% -8%, rgba(200,168,75,0.22), rgba(200,168,75,0.05) 40%, transparent 62%)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 27px, rgba(237,232,222,0.03) 27px, rgba(237,232,222,0.03) 28px)' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(115% 105% at 50% 36%, transparent 42%, rgba(0,0,0,0.45) 80%, rgba(0,0,0,0.68) 100%)' }} />
      <div aria-hidden className="noir-grain" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', inset: 11, pointerEvents: 'none', border: `1px solid rgba(200,168,75,0.16)`, borderRadius: 11 }} />

      <div style={{ position: 'relative', zIndex: 1, padding: 28 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2" style={{ color: C.accent }}>
            <ChallengeIcon slug="the-forger" size={16} color={C.accent} />
            <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700 }}>
              The Forger
            </span>
          </div>
          <SoundToggle accent={C.accent} muted={C.text2} />
        </div>

        {/* Typed document strip */}
        {!isLoading && total > 0 && (
          <div
            className="flex items-center justify-between mb-6"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.text2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: '6px 2px' }}
          >
            <span>Document</span>
            <span style={{ color: C.accent, fontWeight: 700 }}>Nº {docNo}</span>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: C.border, borderTopColor: C.accent }} />
          </div>
        )}

        {!isLoading && total === 0 && (
          <div className="text-center py-12">
            <p style={{ color: C.text2, marginBottom: 16 }}>No documents to forge yet. Check back soon.</p>
            <Link href="/grammar/challenges" style={{ color: C.accent, fontSize: 14, textDecoration: 'none' }}>
              ← Back to Challenges
            </Link>
          </div>
        )}

        {!isLoading && total > 0 && phase === 'intro' && (
          <ChallengeIntro
            {...THEME}
            slug="the-forger"
            kicker="Commission"
            title="The Forger"
            tagline="A stack of documents needs the missing word forged into each line — in flawless German, from memory. No hints."
            rules={[
              'Read the English above, then type the exact missing German word.',
              'Press Enter to commit each forgery — the faster, the better.',
              'String correct forgeries together to build a streak and multiply your score.',
            ]}
            bestBadge={badgeFor(det?.bestScore ?? 0)}
            bestScore={det?.bestScore ?? null}
            beginLabel="Take the Commission"
            onBegin={begin}
            titleFontFamily={MONO}
          />
        )}

        {!isLoading && total > 0 && phase === 'playing' && (
          <div>
            <ChallengeHud
              {...THEME}
              unit="Line"
              index={index}
              total={total}
              points={normalizeScore(raw, perfectRaw)}
              streak={streak}
              multiplier={comboMultiplier(streak)}
              timeMs={timeMs}
              comboFlashKey={comboFlashKey}
            />
            <ForgerQuestion
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
                <span style={{ fontSize: 20, color: C.text2 }}> / 1000</span>
              </h2>
              <div className="flex items-center justify-center gap-3 mt-4">
                <span
                  className="ch-stamp-in"
                  style={{
                    display: 'inline-block',
                    background: badge ? 'rgba(200,168,75,0.15)' : C.surface,
                    color: badge ? C.accent : C.text2,
                    border: `1px solid ${badge ? 'rgba(200,168,75,0.4)' : C.border}`,
                    fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 99,
                  }}
                >
                  {badgeLabel(badge)}
                </span>
                <span style={{ fontSize: 13, color: C.text2 }}>
                  {records.filter((r) => r.correct).length}/{total} forged
                </span>
                <span style={{ fontSize: 13, color: C.text2 }}>Best streak {bestStreak}</span>
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
                    <p style={{ fontFamily: MONO, color: C.text }}>{r.question.replace(/___/g, '____')}</p>
                    <p style={{ color: C.text2, marginTop: 2 }}>
                      {r.correct ? (
                        <span style={{ color: C.accent }}>{r.expected.join(' … ')}</span>
                      ) : (
                        <>
                          you: <span style={{ color: C.red }}>{r.typed.join(' … ') || '—'}</span>
                          {' → '}
                          <span style={{ color: C.accent }}>{r.expected.join(' … ')}</span>
                        </>
                      )}
                      <span style={{ marginLeft: 8, color: C.text2 }}>· {(r.timeMs / 1000).toFixed(1)}s</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/grammar/challenges"
                style={{
                  padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                  background: C.surface, color: C.text2, border: `1px solid ${C.border}`, textDecoration: 'none',
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
                Forge Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
