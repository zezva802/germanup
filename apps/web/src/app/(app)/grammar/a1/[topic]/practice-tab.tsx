'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useExercises, useSubmitResult } from '@/hooks/use-exercises';
import { getAccessToken } from '@/lib/session-store';
import type { Exercise } from '@germanup/types';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { UpgradeModal } from '@/components/upgrade-modal';

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

export function PracticeTab({ topic }: { topic: string }) {
  const { data: session } = useSession();
  const isPro = (session?.user as { plan?: string })?.plan === 'PRO';

  const [difficulty, setDifficulty] = useState<Difficulty>('mixed');
  const [exType, setExType] = useState<ExType>('FILL_BLANK');
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<boolean[]>([]);
  const [answer, setAnswer] = useState<AnswerState>({ submitted: false, userAnswer: '' });
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [unlockedBanner, setUnlockedBanner] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const { data: exercises, isLoading, isError, error, refetch } = useExercises(
    { topic, difficulty, type: exType, limit: SESSION_SIZE },
    true,
  );

  const submitResult = useSubmitResult();

  const currentExercise = exercises?.[sessionIndex];

  const handleTypeChange = (t: ExType) => {
    setExType(t);
    resetSession();
  };

  const handleDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
    resetSession();
  };

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
    const correct =
      answer.userAnswer.trim().toLowerCase() === currentExercise.answer.toLowerCase();

    setAnswer((prev) => ({ ...prev, submitted: true, correct }));
    submitResult.mutate(
      { exerciseId: currentExercise.id, correct, topic },
      { onSuccess: (data) => { if (data.unlockedNextTopic) setUnlockedBanner(true); } },
    );
    setSessionAnswers((prev) => [...prev, correct]);
  }, [currentExercise, answer.userAnswer, topic, submitResult]);

  const handlePickOption = useCallback(
    (option: string) => {
      if (!currentExercise || answer.submitted) return;
      const correct = option === currentExercise.answer;
      setAnswer({ submitted: true, correct, userAnswer: option });
      submitResult.mutate(
        { exerciseId: currentExercise.id, correct, topic },
        { onSuccess: (data) => { if (data.unlockedNextTopic) setUnlockedBanner(true); } },
      );
      setSessionAnswers((prev) => [...prev, correct]);
    },
    [currentExercise, answer.submitted, topic, submitResult],
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

    const body = exType === 'TRANSLATE'
      ? { topic, task: currentExercise.question, studentAnswer: answer.userAnswer }
      : {
          topic,
          task: currentExercise.question,
          requiredElements: Array.isArray(currentExercise.options) ? currentExercise.options as string[] : [],
          studentAnswer: answer.userAnswer,
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

          // Parse JSON verdict as soon as we see the separator
          if (!resultSubmitted && accumulated.includes('\n---\n')) {
            const sepIdx = accumulated.indexOf('\n---\n');
            try {
              const result = JSON.parse(accumulated.slice(0, sepIdx).trim()) as Record<string, unknown>;
              const correct = result.correct === true;
              setAnswer((prev) => ({ ...prev, submitted: true, correct, correctionResult: result }));
              submitResult.mutate(
                { exerciseId: currentExercise.id, correct, topic },
                { onSuccess: (d) => { if (d.unlockedNextTopic) setUnlockedBanner(true); } },
              );
              setSessionAnswers((prev) => [...prev, correct]);
              resultSubmitted = true;
            } catch { /* keep accumulating */ }
          }

          // Stream explanation text after separator
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
  }, [currentExercise, answer.userAnswer, exType, topic, submitResult, session]);

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
        onRestart={() => {
          resetSession();
          void refetch();
        }}
      />
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Difficulty */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Difficulty</p>
          <div className="flex gap-1.5">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => handleDifficultyChange(d.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  difficulty === d.value
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Type</p>
          <div className="flex gap-1.5 flex-wrap">
            {TYPE_OPTIONS.map((t) => {
              const locked = t.proOnly && !isPro;
              return (
                <button
                  key={t.value}
                  onClick={() => handleTypeChange(t.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    exType === t.value
                      ? 'bg-brand-600 text-white'
                      : locked
                        ? 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {t.label}
                  {locked && ' ⭐'}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unlock banner */}
      {unlockedBanner && (
        <div className="mb-4 bg-green-50 border border-green-300 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <span className="text-2xl">🎉</span>
          <div className="flex-1">
            <p className="font-semibold text-green-800">Next topic unlocked!</p>
            <p className="text-sm text-green-600">You completed enough exercises — a new topic is now available.</p>
          </div>
          <button onClick={() => setUnlockedBanner(false)} className="text-green-400 hover:text-green-600 text-lg">
            ✕
          </button>
        </div>
      )}

      {/* Pro gate */}
      {(exType === 'TRANSLATE' || exType === 'FREE_WRITE') && !isPro && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">⭐</p>
          <p className="font-semibold text-brand-800 mb-1">Pro Feature</p>
          <p className="text-brand-600 text-sm mb-4">
            AI-powered correction is available on the Pro plan.
          </p>
          <button
            onClick={() => setUpgradeOpen(true)}
            className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
          >
            Upgrade for €7/month
          </button>
        </div>
      )}
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />

      {/* Exercise */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700 flex items-start gap-3">
          <span className="text-lg leading-none">⚠️</span>
          <div className="flex-1">
            <p className="font-medium">{(error as Error)?.message ?? 'Failed to load exercises'}</p>
          </div>
          <button
            onClick={() => void refetch()}
            className="text-red-600 hover:text-red-800 text-xs font-medium underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && exercises && exercises.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No exercises found for this combination yet. Try a different type or difficulty.
        </div>
      )}

      {!isLoading && currentExercise && (exType !== 'TRANSLATE' && exType !== 'FREE_WRITE' || isPro) && (
        <ExerciseCard
          key={`${sessionKey}-${sessionIndex}`}
          exercise={currentExercise}
          exType={exType}
          answer={answer}
          isPro={isPro}
          isStreaming={isStreaming}
          streamingText={streamingText}
          onTextChange={(v) => setAnswer((a) => ({ ...a, userAnswer: v }))}
          onSubmitFillBlank={handleSubmitFillBlank}
          onPickOption={handlePickOption}
          onSubmitAI={handleSubmitAI}
          onNext={handleNext}
          sessionIndex={sessionIndex}
          sessionSize={Math.min(SESSION_SIZE, exercises.length)}
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
  isPro: boolean;
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
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">
          Exercise {sessionIndex + 1} of {sessionSize}
        </span>
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded',
            exercise.difficulty === 'EASY'
              ? 'bg-green-100 text-green-700'
              : exercise.difficulty === 'MEDIUM'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700',
          )}
        >
          {exercise.difficulty}
        </span>
      </div>

      {/* Question */}
      <p className="text-gray-900 font-medium mb-5 text-base leading-relaxed">{exercise.question}</p>

      {/* Answer UI */}
      {exType === 'FILL_BLANK' && (
        <FillBlankInput
          value={answer.userAnswer}
          submitted={answer.submitted}
          correct={answer.correct}
          correctAnswer={exercise.answer}
          onChange={onTextChange}
          onSubmit={onSubmitFillBlank}
        />
      )}

      {exType === 'MULTIPLE_CHOICE' && (
        <MultipleChoice
          options={(exercise.options as string[]) ?? []}
          submitted={answer.submitted}
          correct={answer.correct}
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

      {/* Result feedback */}
      {answer.submitted && exType !== 'TRANSLATE' && exType !== 'FREE_WRITE' && (
        <div
          className={cn(
            'mt-4 p-4 rounded-lg border',
            answer.correct
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200',
          )}
        >
          <p className={cn('font-semibold mb-1', answer.correct ? 'text-green-700' : 'text-red-700')}>
            {answer.correct ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          {!answer.correct && (
            <p className="text-sm text-gray-700">
              Correct answer: <strong>{exercise.answer}</strong>
            </p>
          )}
          <p className="text-sm text-gray-600 mt-1">{exercise.explanation}</p>
        </div>
      )}

      {/* Next button */}
      {answer.submitted && (
        <button
          onClick={onNext}
          disabled={isStreaming}
          className="mt-4 w-full bg-brand-600 text-white py-2.5 rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {sessionIndex + 1 >= sessionSize ? 'See Results →' : 'Next →'}
        </button>
      )}
    </div>
  );
}

// ─── Input components ─────────────────────────────────────────────────────────

function FillBlankInput({
  value,
  submitted,
  correct,
  correctAnswer,
  onChange,
  onSubmit,
}: {
  value: string;
  submitted: boolean;
  correct?: boolean;
  correctAnswer: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !submitted && onSubmit()}
        disabled={submitted}
        placeholder="Type your answer…"
        className={cn(
          'flex-1 border rounded-lg px-4 py-2.5 text-sm outline-none transition-colors',
          submitted && correct
            ? 'border-green-400 bg-green-50 text-green-800'
            : submitted && !correct
              ? 'border-red-400 bg-red-50'
              : 'border-gray-300 focus:border-brand-400',
        )}
      />
      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
        >
          Check
        </button>
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
  correct?: boolean;
  selectedOption: string;
  correctAnswer: string;
  onPick: (o: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((opt) => {
        const isSelected = selectedOption === opt;
        const isCorrect = opt === correctAnswer;

        let style = 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700';
        if (submitted) {
          if (isCorrect) style = 'border-green-400 bg-green-50 text-green-800 font-medium';
          else if (isSelected && !isCorrect) style = 'border-red-400 bg-red-50 text-red-700';
          else style = 'border-gray-100 bg-gray-50 text-gray-400';
        }

        return (
          <button
            key={opt}
            onClick={() => onPick(opt)}
            disabled={submitted}
            className={cn(
              'border rounded-lg px-4 py-3 text-sm text-left transition-colors',
              style,
            )}
          >
            {submitted && isCorrect && '✓ '}
            {submitted && isSelected && !isCorrect && '✗ '}
            {opt}
          </button>
        );
      })}
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

  // Streaming format: explanation text then "\n💬 " + encouragement
  const rawText = streamingText ?? '';
  const splitIdx = rawText.indexOf('\n💬 ');
  const explanation = rawText.length > 0
    ? (splitIdx !== -1 ? rawText.slice(0, splitIdx).trim() : rawText.trim())
    : (result.explanation as string | undefined);
  const encouragement = rawText.length > 0
    ? (splitIdx !== -1 ? rawText.slice(splitIdx + 4).trim() : undefined)
    : (result.encouragement as string | undefined);

  return (
    <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className={cn(
        'px-4 py-3 flex items-center gap-2',
        correct ? 'bg-green-500' : 'bg-red-500',
      )}>
        <span className="text-white text-lg">{correct ? '✓' : '✗'}</span>
        <span className="text-white font-semibold text-sm">
          {correct ? 'Perfect! No mistakes.' : 'Not quite — see corrections below.'}
        </span>
      </div>

      <div className="bg-white p-4 space-y-4">
        {/* Your answer vs corrected */}
        {!correct && isDifferent && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-gray-400 w-16 pt-0.5 shrink-0">Yours</span>
              <p className="text-sm text-red-600 line-through">{userAnswer}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-medium text-gray-400 w-16 pt-0.5 shrink-0">Correct</span>
              <p className="text-sm text-green-700 font-medium">{corrected}</p>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Mistakes</p>
            <div className="space-y-2">
              {errors.map((err, i) => (
                <div key={i} className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="line-through text-red-500">{err.wrong}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-700 font-semibold">{err.right}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{err.rule}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Missing elements (freewrite only) */}
        {missingElements.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Missing</p>
            <div className="flex flex-wrap gap-1.5">
              {missingElements.map((el, i) => (
                <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  {el}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        {(explanation || isStreaming) && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            <p className="text-xs font-semibold text-blue-600 mb-0.5">Grammar note</p>
            <p className="text-sm text-blue-800">
              {explanation}
              {isStreaming && !encouragement && <span className="animate-pulse">▌</span>}
            </p>
          </div>
        )}

        {/* Encouragement */}
        {encouragement && (
          <p className="text-sm text-gray-500 italic">
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
        placeholder="Write your answer in German…"
        className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-brand-400 resize-none disabled:bg-gray-50"
      />

      {!submitted && !isStreaming && (
        <button
          onClick={onSubmit}
          disabled={!value.trim()}
          className="mt-2 px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
        >
          Submit for AI Review
        </button>
      )}

      {isStreaming && !submitted && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
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
  onRestart,
}: {
  correct: number;
  total: number;
  pct: number;
  onRestart: () => void;
}) {
  const emoji = pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
      <p className="text-5xl mb-4">{emoji}</p>
      <h3 className="text-xl font-bold text-gray-900 mb-1">Session Complete!</h3>
      <p className="text-gray-500 mb-6">
        {correct} / {total} correct
      </p>

      {/* Score ring / bar */}
      <div className="w-32 h-32 mx-auto mb-6 relative flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
          <circle
            cx="18"
            cy="18"
            r="15.9"
            fill="none"
            stroke={pct >= 80 ? '#22c55e' : pct >= 50 ? '#6366f1' : '#f59e0b'}
            strokeWidth="2.5"
            strokeDasharray={`${pct} ${100 - pct}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute text-2xl font-bold text-gray-900">{pct}%</span>
      </div>

      <button
        onClick={onRestart}
        className="px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
      >
        Practice Again
      </button>
    </div>
  );
}
