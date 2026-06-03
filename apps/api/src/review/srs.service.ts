import { Injectable } from '@nestjs/common';
import { CardStateType, ReviewGrade } from '@prisma/client';

/**
 * SM-2-lite spaced-repetition scheduler (DOG-103).
 *
 * Pure, side-effect-free: given a card's current SRS fields, a grade, and the
 * current time, it returns the next SRS fields. All persistence lives in
 * ReviewService; everything here is unit-tested in srs.service.spec.ts.
 *
 * Card lifecycle: NEW -> LEARNING -> REVIEW, with REVIEW lapses dropping to
 * LAPSED and re-entering the learning ladder.
 *
 * DECISION (DOG-121): the optional 4th `Hard` grade is DEFERRED. Adding it means a
 * `ReviewGrade` enum migration plus re-tuning the ease/interval maths and the grade UI; it
 * should wait until real review data shows the 3-grade scheme (Again/Good/Easy) is too coarse.
 */

/** Learning / re-learning steps, in minutes. */
export const LEARNING_STEPS_MIN = [1, 10];
/** Easy on a learning card graduates straight to roughly this many days. */
export const EASY_GRADUATE_DAYS = 4;
/** First graduated review interval (days). */
export const GRADUATE_INTERVAL_DAYS = 1;
export const MIN_EASE = 1.3;
export const EASY_INTERVAL_BONUS = 1.3;
export const EASE_EASY_INCREMENT = 0.15;
export const EASE_AGAIN_DECREMENT = 0.2;

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export interface CardLike {
  state: CardStateType;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  learningStep: number;
}

export interface ScheduleResult {
  state: CardStateType;
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  learningStep: number;
  dueAt: Date;
}

@Injectable()
export class SrsService {
  /** Compute the next SRS state for a card given a grade and the current time. */
  schedule(card: CardLike, grade: ReviewGrade, now: Date): ScheduleResult {
    if (card.state === CardStateType.REVIEW) {
      return this.scheduleReview(card, grade, now);
    }
    // NEW, LEARNING and LAPSED all walk the learning ladder.
    return this.scheduleLearning(card, grade, now);
  }

  private scheduleLearning(card: CardLike, grade: ReviewGrade, now: Date): ScheduleResult {
    const base: ScheduleResult = {
      state: CardStateType.LEARNING,
      ease: card.ease,
      intervalDays: 0,
      reps: card.reps,
      lapses: card.lapses,
      learningStep: card.learningStep,
      dueAt: now,
    };

    if (grade === ReviewGrade.AGAIN) {
      // Reset to the first learning step.
      return {
        ...base,
        learningStep: 0,
        dueAt: this.afterMinutes(now, LEARNING_STEPS_MIN[0]),
      };
    }

    if (grade === ReviewGrade.EASY) {
      // Graduate immediately.
      return {
        ...base,
        state: CardStateType.REVIEW,
        intervalDays: EASY_GRADUATE_DAYS,
        reps: card.reps + 1,
        learningStep: 0,
        dueAt: this.afterDays(now, EASY_GRADUATE_DAYS),
      };
    }

    // GOOD: advance a step, or graduate from the last step.
    const nextStep = card.learningStep + 1;
    if (nextStep >= LEARNING_STEPS_MIN.length) {
      return {
        ...base,
        state: CardStateType.REVIEW,
        intervalDays: GRADUATE_INTERVAL_DAYS,
        reps: card.reps + 1,
        learningStep: 0,
        dueAt: this.afterDays(now, GRADUATE_INTERVAL_DAYS),
      };
    }
    return {
      ...base,
      learningStep: nextStep,
      dueAt: this.afterMinutes(now, LEARNING_STEPS_MIN[nextStep]),
    };
  }

  private scheduleReview(card: CardLike, grade: ReviewGrade, now: Date): ScheduleResult {
    if (grade === ReviewGrade.AGAIN) {
      // Lapse: drop to LAPSED, penalise ease, re-enter the learning ladder.
      return {
        state: CardStateType.LAPSED,
        ease: Math.max(MIN_EASE, card.ease - EASE_AGAIN_DECREMENT),
        intervalDays: 0,
        reps: card.reps,
        lapses: card.lapses + 1,
        learningStep: 0,
        dueAt: this.afterMinutes(now, LEARNING_STEPS_MIN[0]),
      };
    }

    if (grade === ReviewGrade.EASY) {
      const ease = card.ease + EASE_EASY_INCREMENT;
      const interval = Math.max(1, Math.round(card.intervalDays * card.ease * EASY_INTERVAL_BONUS));
      return {
        state: CardStateType.REVIEW,
        ease,
        intervalDays: interval,
        reps: card.reps + 1,
        lapses: card.lapses,
        learningStep: 0,
        dueAt: this.afterDays(now, interval),
      };
    }

    // GOOD
    const interval = Math.max(1, Math.round(card.intervalDays * card.ease));
    return {
      state: CardStateType.REVIEW,
      ease: card.ease,
      intervalDays: interval,
      reps: card.reps + 1,
      lapses: card.lapses,
      learningStep: 0,
      dueAt: this.afterDays(now, interval),
    };
  }

  private afterMinutes(now: Date, minutes: number): Date {
    return new Date(now.getTime() + minutes * MINUTE_MS);
  }

  private afterDays(now: Date, days: number): Date {
    return new Date(now.getTime() + days * DAY_MS);
  }
}
