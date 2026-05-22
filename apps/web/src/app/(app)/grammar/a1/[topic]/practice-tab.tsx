'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useExercises, useSubmitResult } from '@/hooks/use-exercises';
import { getAccessToken } from '@/lib/session-store';
import type { Exercise } from '@germanup/types';
import { Spinner } from '@/components/ui/spinner';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useExerciseKeyboard } from '@/hooks/use-exercise-keyboard';

type Difficulty = 'mixed' | 'EASY' | 'MEDIUM' | 'HARD';
type ExType = 'FILL_BLANK' | 'MULTIPLE_CHOICE' | 'TRANSLATE' | 'FREE_WRITE';

const DIFFICULTY_OPTIONS: { label: string; value: Difficulty }[] = [
  { label: 'Mixed', value: 'mixed' },
  { label: 'Easy', value: 'EASY' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Hard', value: 'HARD' },
];

const TYPE_OPTIONS: { label: string; value: ExType; proOnly?: boolean }[] = [
  { label: 'Fill in Blank', value: 'FILL_BLANK' },
  { label: 'Multiple Choice', value: 'MULTIPLE_CHOICE' },
  { label: 'Translation', value: 'TRANSLATE', proOnly: true },
  { label: 'Free Write', value: 'FREE_WRITE', proOnly: true },
];

const SESSION_SIZE = 10;

interface AnswerState {
  submitted: boolean;
  correct?: boolean;
  userAnswer: string;
  correctionResult?: Record<string, unknown>;
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function KeyboardHint({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center gap-1.5" style={{ color: 'var(--text3)' }} aria-hidden="true">
      {keys.map((k) => (
        <kbd
          key={k}
          className="px-1.5 py-0.5 rounded font-mono font-bold"
          style={{ background: 'var(--s3)', border: '1px solid var(--line2)', color: 'var(--text2)', fontSize: '10px' }}
        >
          {k}
        </kbd>
      ))}
      <span className="text-xs">{label}</span>
    </div>
  );
}

function ProgressDots({
  total,
  answers,
  currentIndex,
}: {
  total: number;
  answers: boolean[];
  currentIndex: number;
}) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label={`${answers.length} of ${total} answered`}
    >
      {Array.from({ length: total }, (_, i) => {
        const isDone = i < answers.length;
        const isCurrent = i === currentIndex;
        const wasCorrect = isDone ? answers[i] : undefined;
        return (
          <div
            key={i}
            aria-hidden="true"
            className="rounded-full transition-all duration-200"
            style={{
              width: isCurrent ? '12px' : '10px',
              height: isCurrent ? '12px' : '10px',
              background: isDone
                ? wasCorrect ? 'var(--green)' : '#EF4444'
                : isCurrent
                  ? 'var(--text2)'
                  : 'var(--line2)',
            }}
          />
        );
      })}
    </div>
  );
}

function RequiredElementTags({ elements }: { elements?: string[] | null }) {
  if (!elements?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3" aria-label="Required elements to include">
      <span className="text-xs font-medium" style={{ color: 'var(--text3)' }}>Must include:</span>
      {elements.map((el, i) => (
        <span
          key={i}
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(251,178,36,0.1)', color: 'var(--amber)', border: '1px solid rgba(251,178,36,0.18)' }}
        >
          {el}
        </span>
      ))}
    </div>
  );
}

// ─── Settings panel (collapsible) ────────────────────────────────────────────

function SettingsPanel({
  difficulty,
  exType,
  isPro,
  onDifficultyChange,
  onTypeChange,
  onClose,
}: {
  difficulty: Difficulty;
  exType: ExType;
  isPro: boolean;
  onDifficultyChange: (d: Difficulty) => void;
  onTypeChange: (t: ExType) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="rounded-xl p-4 border flex flex-col sm:flex-row gap-4 sm:items-end animate-slide-down"
      style={{ background: 'var(--s2)', borderColor: 'var(--line)' }}
      role="region"
      aria-label="Practice settings"
    >
      <div>
        <p className="text-xs mb-1.5 font-medium uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
          Difficulty
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {DIFFICULTY_OPTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => onDifficultyChange(d.value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={
                difficulty === d.value
                  ? { background: 'var(--green)', color: 'var(--bg)' }
                  : { background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }
              }
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs mb-1.5 font-medium uppercase tracking-wide" style={{ color: 'var(--text3)' }}>
          Type
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_OPTIONS.map((t) => {
            const locked = t.proOnly && !isPro;
            return (
              <button
                key={t.value}
                onClick={() => onTypeChange(t.value)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
                style={
                  exType === t.value
                    ? { background: 'var(--green)', color: 'var(--bg)' }
                    : locked
                      ? { background: 'var(--s2)', color: 'var(--text3)', border: '1px solid var(--line)' }
                      : { background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }
                }
              >
                {t.label}{locked && ' ⭐'}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={onClose}
        className="sm:ml-auto text-xs font-medium transition-opacity hover:opacity-70 self-start sm:self-auto"
        style={{ color: 'var(--text3)' }}
      >
        Done
      </button>
    </div>
  );
}

// ─── PracticeTab ──────────────────────────────────────────────────────────────

export function PracticeTab({ topic, topics }: { topic?: string; topics?: string[] }) {
  const { data: session } = useSession();
  const isPro = (session?.user as { plan?: string })?.plan === 'PRO';

  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [exType, setExType] = useState<ExType>('FILL_BLANK');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<boolean[]>([]);
  const [answer, setAnswer] = useState<AnswerState>({ submitted: false, userAnswer: '' });
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [unlockedBanner, setUnlockedBanner] = useState(false);
  const [unlockedShown, setUnlockedShown] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Auto-close settings once user advances past exercise 0
  useEffect(() => {
    if (sessionIndex > 0) setSettingsOpen(false);
  }, [sessionIndex]);

  // Re-open settings when session resets (user can reconfigure)
  useEffect(() => {
    setSettingsOpen(true);
  }, [sessionKey]);

  const { data: exercises, isLoading, isError, error, refetch } = useExercises(
    topics
      ? { topics, difficulty, type: exType, limit: SESSION_SIZE }
      : { topic, difficulty, type: exType, limit: SESSION_SIZE },
    true,
  );

  const submitResult = useSubmitResult();
  const currentExercise = exercises?.[sessionIndex];
  const sessionSize = Math.min(SESSION_SIZE, exercises?.length ?? SESSION_SIZE);

  const handleTypeChange = (t: ExType) => { setExType(t); resetSession(); };
  const handleDifficultyChange = (d: Difficulty) => { setDifficulty(d); resetSession(); };

  function resetSession() {
    setSessionIndex(0);
    setSessionAnswers([]);
    setAnswer({ submitted: false, userAnswer: '' });
    setSessionDone(false);
    setSessionKey((k) => k + 1);
    setIsStreaming(false);
    setStreamingText('');
  }

  const handleSubmitFillBlank = useCallback(() => {
    if (!currentExercise || !answer.userAnswer.trim()) return;
    const correct = answer.userAnswer.trim().toLowerCase() === currentExercise.answer.toLowerCase();
    setAnswer((prev) => ({ ...prev, submitted: true, correct }));
    submitResult.mutate(
      { exerciseId: currentExercise.id, correct, topic: currentExercise.topic },
      { onSuccess: (data) => { if (data.unlockedNextTopic && !unlockedShown) { setUnlockedBanner(true); setUnlockedShown(true); } } },
    );
    setSessionAnswers((prev) => [...prev, correct]);
  }, [currentExercise, answer.userAnswer, submitResult, unlockedShown]);

  const handlePickOption = useCallback(
    (option: string) => {
      if (!currentExercise || answer.submitted) return;
      const correct = option === currentExercise.answer;
      setAnswer({ submitted: true, correct, userAnswer: option });
      submitResult.mutate(
        { exerciseId: currentExercise.id, correct, topic: currentExercise.topic },
        { onSuccess: (data) => { if (data.unlockedNextTopic && !unlockedShown) { setUnlockedBanner(true); setUnlockedShown(true); } } },
      );
      setSessionAnswers((prev) => [...prev, correct]);
    },
    [currentExercise, answer.submitted, submitResult, unlockedShown],
  );

  const handleSubmitAI = useCallback(async () => {
    if (!currentExercise || !answer.userAnswer.trim()) return;
    setIsStreaming(true);
    setStreamingText('');
    const token = getAccessToken() ?? (session?.accessToken as string | undefined);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5001';
    const endpoint = exType === 'TRANSLATE'
      ? `${apiUrl}/exercises/correct-translation/stream`
      : `${apiUrl}/exercises/correct-freewrite/stream`;
    const exerciseTopic = currentExercise.topic;
    const body = exType === 'TRANSLATE'
      ? { topic: exerciseTopic, task: currentExercise.question, studentAnswer: answer.userAnswer }
      : {
          topic: exerciseTopic,
          task: currentExercise.question,
          requiredElements: Array.isArray(currentExercise.options) ? currentExercise.options as string[] : [],
          studentAnswer: answer.userAnswer,
        };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json() as { message?: string };
        throw new Error(errData.message ?? 'Failed to get correction');
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let accumulated = '';
      let resultSubmitted = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          if (data === '[ERROR]') throw new Error('AI correction failed');
          const text = JSON.parse(data) as string;
          accumulated += text;
          if (!resultSubmitted && accumulated.includes('\n---\n')) {
            const sepIdx = accumulated.indexOf('\n---\n');
            try {
              const result = JSON.parse(accumulated.slice(0, sepIdx).trim()) as Record<string, unknown>;
              const correct = result.correct === true;
              setAnswer((prev) => ({ ...prev, submitted: true, correct, correctionResult: result }));
              submitResult.mutate(
                { exerciseId: currentExercise.id, correct, topic: currentExercise.topic },
                { onSuccess: (d) => { if (d.unlockedNextTopic && !unlockedShown) { setUnlockedBanner(true); setUnlockedShown(true); } } },
              );
              setSessionAnswers((prev) => [...prev, correct]);
              resultSubmitted = true;
            } catch { /* keep accumulating */ }
          }
          if (resultSubmitted) {
            const sepIdx = accumulated.indexOf('\n---\n');
            setStreamingText(accumulated.slice(sepIdx + 5));
          }
        }
      }
    } catch (err) {
      console.error('AI correction stream error:', err);
    } finally {
      setIsStreaming(false);
    }
  }, [currentExercise, answer.userAnswer, exType, submitResult, session, unlockedShown]);

  const handleNext = useCallback(() => {
    setIsStreaming(false);
    setStreamingText('');
    if (sessionIndex + 1 >= SESSION_SIZE || sessionIndex + 1 >= (exercises?.length ?? 0)) {
      setSessionDone(true);
    } else {
      setSessionIndex((i) => i + 1);
      setAnswer({ submitted: false, userAnswer: '' });
    }
  }, [sessionIndex, exercises?.length]);

  if (sessionDone && exercises) {
    const correctCount = sessionAnswers.filter(Boolean).length;
    const pct = Math.round((correctCount / sessionAnswers.length) * 100);
    return (
      <SessionSummary
        correct={correctCount}
        total={sessionAnswers.length}
        pct={pct}
        sessionAnswers={sessionAnswers}
        onRestart={() => { resetSession(); void refetch(); }}
      />
    );
  }

  const difficultyStyle =
    currentExercise?.difficulty === 'EASY'
      ? { background: 'rgba(74,222,128,0.1)', color: 'var(--green)' }
      : currentExercise?.difficulty === 'MEDIUM'
        ? { background: 'rgba(251,178,36,0.1)', color: 'var(--amber)' }
        : { background: 'rgba(239,68,68,0.1)', color: '#EF4444' };

  return (
    <div className="flex flex-col gap-4">

      {/* Session header: progress dots + difficulty + settings gear */}
      {currentExercise && !isLoading && !isError && (
        <div className="flex items-center justify-between py-1">
          <ProgressDots
            total={sessionSize}
            answers={sessionAnswers}
            currentIndex={sessionIndex}
          />
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2 py-0.5 rounded" style={difficultyStyle}>
              {currentExercise.difficulty}
            </span>
            <button
              aria-label="Session settings"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((v) => !v)}
              className="p-1.5 rounded-md transition-colors"
              style={{
                color: settingsOpen ? 'var(--text)' : 'var(--text3)',
                background: settingsOpen ? 'var(--s3)' : 'transparent',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Collapsible settings panel */}
      {settingsOpen && (
        <SettingsPanel
          difficulty={difficulty}
          exType={exType}
          isPro={isPro}
          onDifficultyChange={handleDifficultyChange}
          onTypeChange={handleTypeChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Unlock banner */}
      {unlockedBanner && (
        <div className="rounded-xl p-4 flex items-center gap-3 animate-slide-down border" style={{ background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }}>
          <span className="text-2xl">🎉</span>
          <div className="flex-1">
            <p className="font-semibold" style={{ color: 'var(--green)' }}>Next topic unlocked!</p>
            <p className="text-sm" style={{ color: 'var(--text2)' }}>You completed enough exercises — a new topic is now available.</p>
          </div>
          <button onClick={() => setUnlockedBanner(false)} className="text-lg transition-opacity hover:opacity-60" style={{ color: 'var(--text3)' }}>
            ✕
          </button>
        </div>
      )}

      {/* Pro gate */}
      {(exType === 'TRANSLATE' || exType === 'FREE_WRITE') && !isPro && (
        <div className="rounded-xl p-8 text-center border" style={{ background: 'var(--s2)', borderColor: 'var(--line)' }}>
          <p className="text-4xl mb-3">⭐</p>
          <p className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Pro Feature</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
            AI-powered correction is available on the Pro plan.
          </p>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="px-5 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-85"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            Upgrade for €7/month
          </button>
        </div>
      )}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl px-5 py-4 text-sm flex items-start gap-3 border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)', color: '#EF4444' }}>
          <span className="text-lg leading-none">⚠️</span>
          <div className="flex-1">
            <p className="font-medium">{(error as Error)?.message ?? 'Failed to load exercises'}</p>
          </div>
          <button
            onClick={() => void refetch()}
            className="text-xs font-medium underline shrink-0 transition-opacity hover:opacity-70"
            style={{ color: '#EF4444' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && exercises && exercises.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text2)' }}>
          No exercises found for this combination yet. Try a different type or difficulty.
        </div>
      )}

      {/* Exercise card */}
      {!isLoading && currentExercise && (exType !== 'TRANSLATE' && exType !== 'FREE_WRITE' || isPro) && (
        <ExerciseCard
          key={`${sessionKey}-${sessionIndex}`}
          exercise={currentExercise}
          exType={exType}
          answer={answer}
          isStreaming={isStreaming}
          streamingText={streamingText}
          onTextChange={(v) => setAnswer((a) => ({ ...a, userAnswer: v }))}
          onSubmitFillBlank={handleSubmitFillBlank}
          onPickOption={handlePickOption}
          onSubmitAI={handleSubmitAI}
          onNext={handleNext}
          sessionIndex={sessionIndex}
          sessionSize={sessionSize}
        />
      )}
    </div>
  );
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise;
  exType: ExType;
  answer: AnswerState;
  isStreaming: boolean;
  streamingText: string;
  onTextChange: (v: string) => void;
  onSubmitFillBlank: () => void;
  onPickOption: (o: string) => void;
  onSubmitAI: () => void;
  onNext: () => void;
  sessionIndex: number;
  sessionSize: number;
}

function ExerciseCard({
  exercise,
  exType,
  answer,
  isStreaming,
  streamingText,
  onTextChange,
  onSubmitFillBlank,
  onPickOption,
  onSubmitAI,
  onNext,
  sessionIndex,
  sessionSize,
}: ExerciseCardProps) {
  const options = (exercise.options as string[]) ?? [];
  const isLast = sessionIndex + 1 >= sessionSize;

  const pickByIndex = useCallback(
    (idx: number) => {
      const opt = options[idx];
      if (opt !== undefined) onPickOption(opt);
    },
    [options, onPickOption],
  );

  useExerciseKeyboard({
    exType,
    submitted: answer.submitted,
    isStreaming,
    userAnswer: answer.userAnswer,
    optionCount: options.length,
    onSubmitFillBlank,
    onPickOption: pickByIndex,
    onSubmitAI,
    onNext,
  });

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--s2)', borderColor: 'var(--line)' }}>

      {/* Zone 1: Question */}
      <div className="px-6 pt-6 pb-5">
        {exercise.imageUrl && (
          <div className="mb-5 rounded-lg overflow-hidden border" style={{ borderColor: 'var(--line)', background: 'var(--s1)' }}>
            <img src={exercise.imageUrl} alt="Exercise illustration" className="w-full max-h-56 object-contain" />
          </div>
        )}
        <p className="font-medium text-base leading-relaxed" style={{ color: 'var(--text)' }}>
          {exercise.question}
        </p>
        {exType === 'FREE_WRITE' && (
          <RequiredElementTags elements={exercise.options as string[] | null} />
        )}
      </div>

      {/* Zone 2: Answer input */}
      <div className="px-6 pt-5 pb-5" style={{ borderTop: '1px solid var(--line)' }}>
        {exType === 'FILL_BLANK' && (
          <FillBlankInput
            value={answer.userAnswer}
            submitted={answer.submitted}
            correct={answer.correct}
            onChange={onTextChange}
            onSubmit={onSubmitFillBlank}
          />
        )}
        {exType === 'MULTIPLE_CHOICE' && (
          <MultipleChoice
            options={options}
            submitted={answer.submitted}
            selectedOption={answer.userAnswer}
            correctAnswer={exercise.answer}
            onPick={onPickOption}
          />
        )}
        {(exType === 'TRANSLATE' || exType === 'FREE_WRITE') && (
          <AIInput
            value={answer.userAnswer}
            submitted={answer.submitted}
            isStreaming={isStreaming}
            streamingText={streamingText}
            correctionResult={answer.correctionResult}
            onChange={onTextChange}
            onSubmit={onSubmitAI}
          />
        )}
      </div>

      {/* Zone 3: Feedback — slides in after submission (fill/MC only; AI has its own inline) */}
      {answer.submitted && exType !== 'TRANSLATE' && exType !== 'FREE_WRITE' && (
        <div className="px-6 pb-5 animate-slide-down" style={{ borderTop: '1px solid var(--line)' }}>
          <div
            className="rounded-lg p-4 border"
            style={
              answer.correct
                ? { background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.25)' }
                : { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }
            }
          >
            <div role="status" aria-live="polite">
              <p className="font-semibold mb-1" style={{ color: answer.correct ? 'var(--green)' : '#EF4444' }}>
                {answer.correct ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {!answer.correct && (
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  Correct answer: <strong>{exercise.answer}</strong>
                </p>
              )}
              <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>{exercise.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Zone 4: Action row — slides in after submission */}
      {answer.submitted && (
        <div
          className="px-6 pb-6 pt-4 flex items-center justify-between animate-slide-down"
          style={{ borderTop: '1px solid var(--line)' }}
        >
          <KeyboardHint keys={['↵', 'Space']} label="to continue" />
          <button
            onClick={onNext}
            disabled={isStreaming}
            className="px-6 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            {isLast ? 'See Results →' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Input components ─────────────────────────────────────────────────────────

function FillBlankInput({
  value,
  submitted,
  correct,
  onChange,
  onSubmit,
}: {
  value: string;
  submitted: boolean;
  correct?: boolean;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const inputStyle = submitted && correct
    ? { borderColor: 'var(--green)', background: 'rgba(74,222,128,0.08)', color: 'var(--green)' }
    : submitted && !correct
      ? { borderColor: '#EF4444', background: 'rgba(239,68,68,0.08)', color: '#EF4444' }
      : { borderColor: 'var(--line2)', background: 'var(--s1)', color: 'var(--text)' };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={submitted}
          autoFocus
          placeholder="Type your answer…"
          aria-label="Your answer"
          className="flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--green)] placeholder:text-[var(--text3)]"
          style={inputStyle}
        />
        {!submitted && (
          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            Check
          </button>
        )}
      </div>
      {!submitted && value.trim() && (
        <div className="mt-2">
          <KeyboardHint keys={['↵']} label="to submit" />
        </div>
      )}
    </div>
  );
}

function MultipleChoice({
  options,
  submitted,
  selectedOption,
  correctAnswer,
  onPick,
}: {
  options: string[];
  submitted: boolean;
  selectedOption: string;
  correctAnswer: string;
  onPick: (o: string) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Answer options">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === opt;
          const isCorrect = opt === correctAnswer;

          let optStyle: React.CSSProperties = { borderColor: 'var(--line)', background: 'var(--s1)', color: 'var(--text)' };
          if (submitted) {
            if (isCorrect) optStyle = { borderColor: 'var(--green)', background: 'rgba(74,222,128,0.08)', color: 'var(--green)' };
            else if (isSelected && !isCorrect) optStyle = { borderColor: '#EF4444', background: 'rgba(239,68,68,0.08)', color: '#EF4444' };
            else optStyle = { borderColor: 'var(--line)', background: 'var(--s2)', color: 'var(--text3)' };
          }

          return (
            <button
              key={opt}
              onClick={() => !submitted && onPick(opt)}
              disabled={submitted}
              aria-label={`Option ${idx + 1}: ${opt}`}
              aria-pressed={submitted && isSelected}
              className="border rounded-lg px-4 py-3 text-sm text-left relative transition-opacity hover:opacity-80 disabled:cursor-default"
              style={optStyle}
            >
              {/* Number badge */}
              <span
                className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center font-mono font-bold"
                aria-hidden="true"
                style={{ background: 'var(--s3)', border: '1px solid var(--line2)', color: 'var(--text3)', fontSize: '10px' }}
              >
                {idx + 1}
              </span>
              {submitted && isCorrect && <span className="mr-1">✓</span>}
              {submitted && isSelected && !isCorrect && <span className="mr-1">✗</span>}
              {opt}
            </button>
          );
        })}
      </div>
      {!submitted && (
        <div className="mt-2">
          <KeyboardHint keys={['1', '2', '3', '4'].slice(0, Math.min(options.length, 4))} label="to answer" />
        </div>
      )}
      <div role="status" aria-live="polite" className="sr-only">
        {submitted
          ? selectedOption === correctAnswer
            ? 'Correct!'
            : `Incorrect. The correct answer is ${correctAnswer}.`
          : ''}
      </div>
    </div>
  );
}

function CorrectionResult({ result, userAnswer, streamingText, isStreaming }: {
  result: Record<string, unknown>;
  userAnswer: string;
  streamingText?: string;
  isStreaming?: boolean;
}) {
  const correct = result.correct as boolean;
  const corrected = result.corrected as string | undefined;
  const errors = (result.errors as Array<{ wrong: string; right: string; rule: string }>) ?? [];
  const missingElements = (result.missingElements as string[]) ?? [];
  const isDifferent = corrected && corrected.trim() !== userAnswer.trim();

  const rawText = streamingText ?? '';
  const splitIdx = rawText.indexOf('\n💬 ');
  const explanation = rawText.length > 0
    ? (splitIdx !== -1 ? rawText.slice(0, splitIdx).trim() : rawText.trim())
    : (result.explanation as string | undefined);
  const encouragement = rawText.length > 0
    ? (splitIdx !== -1 ? rawText.slice(splitIdx + 4).trim() : undefined)
    : (result.encouragement as string | undefined);

  return (
    <div className="mt-4 rounded-xl overflow-hidden border animate-slide-down" style={{ borderColor: 'var(--line)' }} role="status">
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ background: correct ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)' }}
      >
        <span className="text-lg" style={{ color: correct ? 'var(--green)' : '#EF4444' }}>{correct ? '✓' : '✗'}</span>
        <span className="font-semibold text-sm" style={{ color: correct ? 'var(--green)' : '#EF4444' }}>
          {correct ? 'Perfect! No mistakes.' : 'Not quite — see corrections below.'}
        </span>
      </div>

      <div className="p-4 space-y-4" style={{ background: 'var(--s2)' }}>
        {!correct && isDifferent && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium w-16 pt-0.5 shrink-0" style={{ color: 'var(--text3)' }}>Yours</span>
              <p className="text-sm line-through" style={{ color: '#EF4444' }}>{userAnswer}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium w-16 pt-0.5 shrink-0" style={{ color: 'var(--text3)' }}>Correct</span>
              <p className="text-sm font-medium" style={{ color: 'var(--green)' }}>{corrected}</p>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text3)' }}>Mistakes</p>
            <div className="space-y-2">
              {errors.map((err, i) => (
                <div key={i} className="rounded-lg px-3 py-2 border" style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.15)' }}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="line-through" style={{ color: '#EF4444' }}>{err.wrong}</span>
                    <span style={{ color: 'var(--text3)' }}>→</span>
                    <span className="font-semibold" style={{ color: 'var(--green)' }}>{err.right}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text2)' }}>{err.rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {missingElements.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text3)' }}>Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {missingElements.map((el, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(251,178,36,0.1)', color: 'var(--amber)' }}>
                  {el}
                </span>
              ))}
            </div>
          </div>
        )}

        {(explanation || isStreaming) && (
          <div className="rounded-lg px-3 py-2 border" style={{ background: 'var(--s3)', borderColor: 'var(--line2)' }}>
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--green)' }}>Grammar note</p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              {explanation}
              {isStreaming && !encouragement && <span className="animate-pulse">▌</span>}
            </p>
          </div>
        )}

        {encouragement && (
          <p className="text-sm italic" style={{ color: 'var(--text2)' }}>
            💬 {encouragement}
            {isStreaming && <span className="animate-pulse">▌</span>}
          </p>
        )}
      </div>
    </div>
  );
}

function AIInput({
  value,
  submitted,
  isStreaming,
  streamingText,
  correctionResult,
  onChange,
  onSubmit,
}: {
  value: string;
  submitted: boolean;
  isStreaming: boolean;
  streamingText: string;
  correctionResult?: Record<string, unknown>;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={submitted || isStreaming}
        rows={3}
        autoFocus
        placeholder="Write your answer in German…"
        aria-label="Write your German answer"
        aria-busy={isStreaming}
        className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none resize-none placeholder:text-[var(--text3)] focus:border-[var(--green)] transition-colors"
        style={{ borderColor: 'var(--line2)', background: 'var(--s1)', color: 'var(--text)' }}
      />

      {!submitted && !isStreaming && (
        <div className="mt-2 flex items-center justify-between">
          <KeyboardHint keys={['Ctrl', '↵']} label="to submit" />
          <button
            onClick={onSubmit}
            disabled={!value.trim()}
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: 'var(--green)', color: 'var(--bg)' }}
          >
            Submit for AI Review
          </button>
        </div>
      )}

      {isStreaming && (
        <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: 'var(--text2)' }}>
          <Spinner className="w-4 h-4" />
          <span>AI is reviewing your answer…</span>
        </div>
      )}

      {submitted && correctionResult && (
        <CorrectionResult
          result={correctionResult}
          userAnswer={value}
          streamingText={streamingText}
          isStreaming={isStreaming}
        />
      )}
    </div>
  );
}

// ─── Session Summary ──────────────────────────────────────────────────────────

function SessionSummary({
  correct,
  total,
  pct,
  sessionAnswers,
  onRestart,
}: {
  correct: number;
  total: number;
  pct: number;
  sessionAnswers: boolean[];
  onRestart: () => void;
}) {
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';
  const message = pct >= 80 ? 'Outstanding work!' : pct >= 50 ? 'Good effort — keep going!' : 'Keep practicing — every attempt counts!';

  return (
    <div className="rounded-xl p-8 text-center border" style={{ background: 'var(--s2)', borderColor: 'var(--line)' }}>
      <p className="text-5xl mb-4">{emoji}</p>
      <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>Session Complete!</h3>
      <p className="mb-1" style={{ color: 'var(--text2)' }}>{correct} / {total} correct</p>
      <p className="text-sm mb-6" style={{ color: 'var(--text2)' }}>{message}</p>

      {/* Score ring */}
      <div className="w-32 h-32 mx-auto mb-5 relative flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--line2)" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={pct >= 80 ? 'var(--green)' : pct >= 50 ? '#818CF8' : 'var(--amber)'}
            strokeWidth="2.5"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-2xl font-bold" style={{ color: 'var(--text)' }}>{pct}%</span>
      </div>

      {/* Dot replay */}
      <div className="flex justify-center gap-1.5 mb-6">
        {sessionAnswers.map((wasCorrect, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full"
            title={`Exercise ${i + 1}: ${wasCorrect ? 'correct' : 'incorrect'}`}
            style={{ background: wasCorrect ? 'var(--green)' : '#EF4444' }}
          />
        ))}
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-3 rounded-lg font-medium transition-opacity hover:opacity-85"
        style={{ background: 'var(--green)', color: 'var(--bg)' }}
      >
        Practice Again
      </button>
    </div>
  );
}
