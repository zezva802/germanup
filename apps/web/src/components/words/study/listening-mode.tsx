'use client';

import { TypingMode } from './type-mode';
import type { ReviewItem, ReviewGrade } from '@/types/words';

interface ListeningModeProps {
  item: ReviewItem;
  onGrade: (grade: ReviewGrade) => void;
  speak: (text: string, opts?: { audioUrl?: string }) => void;
  supported: boolean;
}

/** Listening is the typing flow with audio prompt instead of the English word. */
export function ListeningMode(props: ListeningModeProps) {
  return <TypingMode {...props} listening />;
}
