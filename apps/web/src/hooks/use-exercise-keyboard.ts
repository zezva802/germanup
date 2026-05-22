import { useEffect } from 'react';

type ExType = 'FILL_BLANK' | 'MULTIPLE_CHOICE' | 'TRANSLATE' | 'FREE_WRITE';

interface UseExerciseKeyboardOptions {
  exType: ExType;
  submitted: boolean;
  isStreaming: boolean;
  userAnswer: string;
  optionCount: number;
  onSubmitFillBlank: () => void;
  onPickOption: (index: number) => void;
  onSubmitAI: () => void;
  onNext: () => void;
}

export function useExerciseKeyboard({
  exType,
  submitted,
  isStreaming,
  userAnswer,
  optionCount,
  onSubmitFillBlank,
  onPickOption,
  onSubmitAI,
  onNext,
}: UseExerciseKeyboardOptions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // After submission: Enter or Space → Next (not streaming)
      if (submitted && !isStreaming) {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.key === ' ') e.preventDefault();
          // FILL_BLANK input is disabled after submit — Enter still fires here
          if (!isTyping || exType === 'FILL_BLANK') {
            onNext();
            return;
          }
        }
      }

      // FILL_BLANK: Enter to submit (input must be focused)
      if (exType === 'FILL_BLANK' && !submitted && isTyping) {
        if (e.key === 'Enter' && userAnswer.trim()) {
          onSubmitFillBlank();
          return;
        }
      }

      // MULTIPLE_CHOICE: digit keys 1–4 (not when typing)
      if (exType === 'MULTIPLE_CHOICE' && !submitted && !isTyping) {
        const digit = parseInt(e.key, 10);
        if (!isNaN(digit) && digit >= 1 && digit <= optionCount) {
          onPickOption(digit - 1);
          return;
        }
      }

      // TRANSLATE / FREE_WRITE: Ctrl+Enter or Cmd+Enter to submit
      if ((exType === 'TRANSLATE' || exType === 'FREE_WRITE') && !submitted && !isStreaming) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && userAnswer.trim()) {
          e.preventDefault();
          onSubmitAI();
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exType, submitted, isStreaming, userAnswer, optionCount, onSubmitFillBlank, onPickOption, onSubmitAI, onNext]);
}
