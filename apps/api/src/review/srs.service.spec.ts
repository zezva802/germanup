import { CardStateType, ReviewGrade } from '@prisma/client';
import {
  SrsService,
  CardLike,
  LEARNING_STEPS_MIN,
  EASY_GRADUATE_DAYS,
  GRADUATE_INTERVAL_DAYS,
  MIN_EASE,
  EASE_EASY_INCREMENT,
  EASE_AGAIN_DECREMENT,
} from './srs.service';

const NOW = new Date('2026-06-01T12:00:00.000Z');
const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

// Day-level dues are anchored to local start-of-day (DOG-131), so expected day dues are
// measured from midnight of NOW, not NOW itself. Computed the same way as the implementation.
const DAY_START = (() => {
  const d = new Date(NOW);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();

function card(overrides: Partial<CardLike> = {}): CardLike {
  return {
    state: CardStateType.NEW,
    ease: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    learningStep: 0,
    ...overrides,
  };
}

describe('SrsService', () => {
  let srs: SrsService;
  beforeEach(() => {
    srs = new SrsService();
  });

  describe('NEW / LEARNING', () => {
    it('GOOD on a NEW card advances to the next learning step (10m)', () => {
      const r = srs.schedule(card({ state: CardStateType.NEW }), ReviewGrade.GOOD, NOW);
      expect(r.state).toBe(CardStateType.LEARNING);
      expect(r.learningStep).toBe(1);
      expect(r.intervalDays).toBe(0);
      expect(r.dueAt.getTime()).toBe(NOW.getTime() + LEARNING_STEPS_MIN[1] * MINUTE);
      expect(r.reps).toBe(0); // reps only increments on graduation/review
    });

    it('GOOD on the last learning step graduates to REVIEW with interval 1', () => {
      const last = LEARNING_STEPS_MIN.length - 1;
      const r = srs.schedule(card({ state: CardStateType.LEARNING, learningStep: last }), ReviewGrade.GOOD, NOW);
      expect(r.state).toBe(CardStateType.REVIEW);
      expect(r.intervalDays).toBe(GRADUATE_INTERVAL_DAYS);
      expect(r.learningStep).toBe(0);
      expect(r.reps).toBe(1);
      expect(r.dueAt.getTime()).toBe(DAY_START + GRADUATE_INTERVAL_DAYS * DAY);
    });

    it('EASY on a learning card graduates immediately (~4 days)', () => {
      const r = srs.schedule(card({ state: CardStateType.NEW }), ReviewGrade.EASY, NOW);
      expect(r.state).toBe(CardStateType.REVIEW);
      expect(r.intervalDays).toBe(EASY_GRADUATE_DAYS);
      expect(r.reps).toBe(1);
      expect(r.dueAt.getTime()).toBe(DAY_START + EASY_GRADUATE_DAYS * DAY);
    });

    it('AGAIN on a learning card resets to the first step (1m)', () => {
      const r = srs.schedule(card({ state: CardStateType.LEARNING, learningStep: 1 }), ReviewGrade.AGAIN, NOW);
      expect(r.state).toBe(CardStateType.LEARNING);
      expect(r.learningStep).toBe(0);
      expect(r.intervalDays).toBe(0);
      expect(r.dueAt.getTime()).toBe(NOW.getTime() + LEARNING_STEPS_MIN[0] * MINUTE);
    });
  });

  describe('REVIEW', () => {
    const reviewCard = () =>
      card({ state: CardStateType.REVIEW, ease: 2.5, intervalDays: 10, reps: 3 });

    it('GOOD multiplies interval by ease (round)', () => {
      const r = srs.schedule(reviewCard(), ReviewGrade.GOOD, NOW);
      expect(r.state).toBe(CardStateType.REVIEW);
      expect(r.intervalDays).toBe(25); // round(10 * 2.5)
      expect(r.ease).toBe(2.5); // unchanged
      expect(r.reps).toBe(4);
      expect(r.dueAt.getTime()).toBe(DAY_START + 25 * DAY);
    });

    it('EASY multiplies by ease * 1.3 and bumps ease', () => {
      const r = srs.schedule(reviewCard(), ReviewGrade.EASY, NOW);
      expect(r.intervalDays).toBe(33); // round(10 * 2.5 * 1.3) = round(32.5) = 33
      expect(r.ease).toBeCloseTo(2.5 + EASE_EASY_INCREMENT);
      expect(r.reps).toBe(4);
      expect(r.dueAt.getTime()).toBe(DAY_START + 33 * DAY);
    });

    it('AGAIN lapses: LAPSED, ease penalised, lapses++, re-enters learning (1m)', () => {
      const r = srs.schedule(reviewCard(), ReviewGrade.AGAIN, NOW);
      expect(r.state).toBe(CardStateType.LAPSED);
      expect(r.ease).toBeCloseTo(2.5 - EASE_AGAIN_DECREMENT);
      expect(r.lapses).toBe(1);
      expect(r.intervalDays).toBe(0);
      expect(r.learningStep).toBe(0);
      expect(r.dueAt.getTime()).toBe(NOW.getTime() + LEARNING_STEPS_MIN[0] * MINUTE);
    });

    it('clamps ease at the minimum on repeated lapses', () => {
      const r = srs.schedule(reviewCard(), ReviewGrade.AGAIN, NOW);
      const r2 = srs.schedule({ ...reviewCard(), ease: MIN_EASE }, ReviewGrade.AGAIN, NOW);
      expect(r.ease).toBeGreaterThanOrEqual(MIN_EASE);
      expect(r2.ease).toBe(MIN_EASE);
    });

    it('never produces a sub-1-day review interval', () => {
      const r = srs.schedule(card({ state: CardStateType.REVIEW, ease: 1.3, intervalDays: 0.5 }), ReviewGrade.GOOD, NOW);
      expect(r.intervalDays).toBeGreaterThanOrEqual(1);
    });
  });

  describe('LAPSED (re-learning)', () => {
    it('GOOD walks the learning ladder again from a LAPSED card', () => {
      const r = srs.schedule(card({ state: CardStateType.LAPSED, learningStep: 0, lapses: 1 }), ReviewGrade.GOOD, NOW);
      expect(r.state).toBe(CardStateType.LEARNING);
      expect(r.learningStep).toBe(1);
      expect(r.lapses).toBe(1);
    });

    it('GOOD on the last step re-graduates a LAPSED card to REVIEW', () => {
      const last = LEARNING_STEPS_MIN.length - 1;
      const r = srs.schedule(card({ state: CardStateType.LAPSED, learningStep: last, lapses: 2 }), ReviewGrade.GOOD, NOW);
      expect(r.state).toBe(CardStateType.REVIEW);
      expect(r.intervalDays).toBe(GRADUATE_INTERVAL_DAYS);
    });
  });
});
