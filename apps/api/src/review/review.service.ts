import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SrsService } from './srs.service';
import { SaveGradeDto } from './dto/save-grade.dto';
import { CardStateType, Plan, Prisma } from '@prisma/client';

/** Free-plan daily caps (tune later; Pro is unlimited). */
export const FREE_REVIEW_CAP = 120;
export const FREE_NEW_CAP = 20;

/** States that represent a card already in rotation (i.e. not a brand-new card). */
const DUE_STATES: CardStateType[] = [
  CardStateType.LEARNING,
  CardStateType.REVIEW,
  CardStateType.LAPSED,
];

const WORD_SELECT = {
  id: true,
  german: true,
  english: true,
  gender: true,
  plural: true,
  example: true,
  partOfSpeech: true,
  conjugation: true,
  level: true,
} satisfies Prisma.WordSelect;

@Injectable()
export class ReviewService {
  constructor(
    private prisma: PrismaService,
    private srs: SrsService,
  ) {}

  /** Due reviews + a capped batch of new cards, interleaved, each with its Word. */
  async getQueue(userId: string, plan: Plan, deck?: string) {
    const now = new Date();
    const unlimited = plan === Plan.PRO;
    const reviewCap = unlimited ? undefined : FREE_REVIEW_CAP;
    const newCap = unlimited ? undefined : FREE_NEW_CAP;

    const deckFilter = deck ? { word: { deckId: deck } } : {};

    const [due, fresh] = await Promise.all([
      this.prisma.cardState.findMany({
        where: { userId, state: { in: DUE_STATES }, dueAt: { lte: now }, ...deckFilter },
        orderBy: { dueAt: 'asc' },
        take: reviewCap,
        include: { word: { select: WORD_SELECT } },
      }),
      this.prisma.cardState.findMany({
        where: { userId, state: CardStateType.NEW, ...deckFilter },
        orderBy: { dueAt: 'asc' },
        take: newCap,
        include: { word: { select: WORD_SELECT } },
      }),
    ]);

    const items = interleave(due, fresh).map((c) => ({
      wordId: c.wordId,
      state: c.state,
      dueAt: c.dueAt,
      intervalDays: c.intervalDays,
      ease: c.ease,
      reps: c.reps,
      lapses: c.lapses,
      word: c.word,
    }));

    return {
      count: items.length,
      dueCount: due.length,
      newCount: fresh.length,
      items,
    };
  }

  /** Grade a card: advance SRS state, log the review, contribute to the streak. */
  async grade(userId: string, dto: SaveGradeDto) {
    const now = new Date();

    let card = await this.prisma.cardState.findUnique({
      where: { userId_wordId: { userId, wordId: dto.wordId } },
    });

    if (!card) {
      const word = await this.prisma.word.findUnique({ where: { id: dto.wordId } });
      if (!word) throw new NotFoundException('Word not found');
      card = await this.prisma.cardState.create({
        data: { userId, wordId: dto.wordId },
      });
    }

    const next = this.srs.schedule(card, dto.grade, now);

    const [updated] = await Promise.all([
      this.prisma.cardState.update({
        where: { userId_wordId: { userId, wordId: dto.wordId } },
        data: {
          state: next.state,
          ease: next.ease,
          intervalDays: next.intervalDays,
          reps: next.reps,
          lapses: next.lapses,
          learningStep: next.learningStep,
          dueAt: next.dueAt,
          lastReviewedAt: now,
        },
      }),
      this.prisma.reviewLog.create({
        data: {
          userId,
          wordId: dto.wordId,
          grade: dto.grade,
          mode: dto.mode,
          intervalAfter: next.intervalDays,
        },
      }),
      // Mirror the exercises pattern: record activity for the streak calendar.
      this.prisma.practiceSession.create({
        data: { userId, type: 'review', topic: 'vocab', score: 1, total: 1, duration: 0 },
      }),
    ]);

    const { streakUpdated } = await this.registerDailyActivity(userId, now);

    return {
      state: updated.state,
      dueAt: updated.dueAt,
      intervalDays: updated.intervalDays,
      streakUpdated,
    };
  }

  /** Basic stats for the Words trainer (advanced fields are a Pro Phase-2 ticket). */
  async getStats(userId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [grouped, total, reviewsToday, dueToday, user] = await Promise.all([
      this.prisma.cardState.groupBy({ by: ['state'], where: { userId }, _count: { _all: true } }),
      this.prisma.cardState.count({ where: { userId } }),
      this.prisma.reviewLog.count({ where: { userId, reviewedAt: { gte: todayStart } } }),
      this.prisma.cardState.count({
        where: { userId, state: { in: DUE_STATES }, dueAt: { lt: todayEnd } },
      }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { streakCount: true } }),
    ]);

    const byState = {
      new: 0,
      learning: 0,
      review: 0,
      lapsed: 0,
    };
    for (const g of grouped) {
      if (g.state === CardStateType.NEW) byState.new = g._count._all;
      else if (g.state === CardStateType.LEARNING) byState.learning = g._count._all;
      else if (g.state === CardStateType.REVIEW) byState.review = g._count._all;
      else if (g.state === CardStateType.LAPSED) byState.lapsed = g._count._all;
    }

    return {
      totalWords: total,
      byState,
      reviewsToday,
      dueToday,
      streak: user?.streakCount ?? 0,
    };
  }

  /**
   * Idempotent per-day streak touch. Only the first qualifying activity of the
   * day advances the streak; later calls (and the exercises path) are no-ops
   * once lastActiveDate is today, so the two features never double-count or reset.
   */
  private async registerDailyActivity(userId: string, now: Date): Promise<{ streakUpdated: boolean }> {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, lastActiveDate: true },
    });
    if (!user) return { streakUpdated: false };

    if (user.lastActiveDate && new Date(user.lastActiveDate).getTime() >= todayStart.getTime()) {
      return { streakUpdated: false }; // already counted today
    }

    const yesterday = new Date(todayStart);
    yesterday.setDate(yesterday.getDate() - 1);
    const wasActiveYesterday =
      user.lastActiveDate !== null &&
      new Date(user.lastActiveDate).getTime() >= yesterday.getTime() &&
      new Date(user.lastActiveDate).getTime() < todayStart.getTime();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        streakCount: wasActiveYesterday ? user.streakCount + 1 : 1,
        lastActiveDate: todayStart,
      },
    });
    return { streakUpdated: true };
  }
}

/** Interleave two ordered lists (a, b, a, b, …), appending any remainder. */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
  }
  return out;
}
