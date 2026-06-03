import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SrsService } from './srs.service';
import { SaveGradeDto } from './dto/save-grade.dto';
import { CardStateType, Plan, Prisma, ReviewGrade } from '@prisma/client';
import { CAPS } from '../common/caps';

/** Advanced-stats tuning (DOG-115). */
export const RETENTION_WINDOW_DAYS = 30;
export const FORECAST_DAYS = 14;
export const LEECH_LAPSE_THRESHOLD = 8;
export const LEECH_LIMIT = 50;

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
    const reviewCap = unlimited ? undefined : CAPS.freeReviewsPerDay;
    const newCap = unlimited ? undefined : CAPS.freeNewPerDay;

    const deckFilter = deck ? { word: { deckId: deck } } : {};

    const [due, fresh] = await Promise.all([
      this.prisma.cardState.findMany({
        where: { userId, suspended: false, state: { in: DUE_STATES }, dueAt: { lte: now }, ...deckFilter },
        orderBy: { dueAt: 'asc' },
        take: reviewCap,
        include: { word: { select: WORD_SELECT } },
      }),
      this.prisma.cardState.findMany({
        where: { userId, suspended: false, state: CardStateType.NEW, ...deckFilter },
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

  /**
   * Suspend/unsuspend a card (DOG-121). Suspended cards are excluded from the study queue
   * and due counts. Owner-scoped via the userId+wordId card key.
   */
  async setSuspended(userId: string, wordId: string, suspended: boolean) {
    const card = await this.prisma.cardState.findUnique({
      where: { userId_wordId: { userId, wordId } },
    });
    if (!card) throw new NotFoundException('Card not found');
    await this.prisma.cardState.update({
      where: { userId_wordId: { userId, wordId } },
      data: { suspended },
    });
    return { wordId, suspended };
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
        where: { userId, suspended: false, state: { in: DUE_STATES }, dueAt: { lt: todayEnd } },
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
   * Pro advanced stats (DOG-115): retention %, due forecast, and leeches — all derived
   * from ReviewLog + CardState (nothing stored redundantly). Pro-gated.
   *
   * Retention: ReviewLog has no per-log state snapshot, so "mature recall" is approximated
   * as: among reviews of cards currently mature (REVIEW or LAPSED), the share not graded AGAIN
   * over the trailing window. A previous equal window is also returned for a trend delta.
   */
  async getAdvancedStats(userId: string, plan: Plan) {
    if (plan !== Plan.PRO) {
      throw new ForbiddenException('Advanced stats are a Pro feature');
    }

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const windowStart = new Date(now.getTime() - RETENTION_WINDOW_DAYS * day);
    const prevWindowStart = new Date(now.getTime() - 2 * RETENTION_WINDOW_DAYS * day);

    // Cards that have graduated at least once count as "mature" for retention.
    const mature = await this.prisma.cardState.findMany({
      where: { userId, state: { in: [CardStateType.REVIEW, CardStateType.LAPSED] } },
      select: { wordId: true },
    });
    const matureWordIds = mature.map((c) => c.wordId);

    const retention = await this.computeRetention(userId, matureWordIds, windowStart, now);
    const retentionPrev = await this.computeRetention(userId, matureWordIds, prevWindowStart, windowStart);

    // Due forecast: cards in rotation becoming due over the next FORECAST_DAYS days.
    const forecastEnd = new Date(todayStart.getTime() + FORECAST_DAYS * day);
    const dueCards = await this.prisma.cardState.findMany({
      where: { userId, suspended: false, state: { in: DUE_STATES }, dueAt: { lt: forecastEnd } },
      select: { dueAt: true },
    });

    // Label buckets with local Y-M-D (todayStart is local midnight; toISOString would shift the day in non-UTC zones).
    const buckets = Array.from({ length: FORECAST_DAYS }, (_, i) => {
      const d = new Date(todayStart.getTime() + i * day);
      return { date: localYmd(d), count: 0 };
    });
    for (const c of dueCards) {
      const offset = Math.floor((c.dueAt.getTime() - todayStart.getTime()) / day);
      const idx = Math.min(Math.max(offset, 0), FORECAST_DAYS - 1); // overdue lumps into today
      buckets[idx].count++;
    }

    // Leeches: words lapsed too many times — candidates to relearn or suspend.
    const leechCards = await this.prisma.cardState.findMany({
      where: { userId, lapses: { gte: LEECH_LAPSE_THRESHOLD } },
      orderBy: { lapses: 'desc' },
      take: LEECH_LIMIT,
      include: { word: { select: { id: true, german: true, english: true, deckId: true } } },
    });
    const leeches = leechCards.map((c) => ({
      wordId: c.wordId,
      deckId: c.word.deckId,
      german: c.word.german,
      english: c.word.english,
      lapses: c.lapses,
      state: c.state,
      suspended: c.suspended,
    }));

    return {
      window: { days: RETENTION_WINDOW_DAYS },
      retention: {
        pct: retention.pct,
        prevPct: retentionPrev.pct,
        reviewsCounted: retention.total,
      },
      forecast: buckets,
      leeches,
      leechThreshold: LEECH_LAPSE_THRESHOLD,
    };
  }

  /** Share of non-AGAIN grades among mature-card reviews in [from, to). null if no data. */
  private async computeRetention(userId: string, matureWordIds: string[], from: Date, to: Date) {
    if (matureWordIds.length === 0) return { pct: null as number | null, total: 0 };

    const where: Prisma.ReviewLogWhereInput = {
      userId,
      wordId: { in: matureWordIds },
      reviewedAt: { gte: from, lt: to },
    };
    const [total, passed] = await Promise.all([
      this.prisma.reviewLog.count({ where }),
      this.prisma.reviewLog.count({ where: { ...where, grade: { not: ReviewGrade.AGAIN } } }),
    ]);
    if (total === 0) return { pct: null as number | null, total: 0 };
    return { pct: Math.round((passed / total) * 1000) / 10, total };
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

/** Format a Date as local YYYY-MM-DD (not UTC, so day labels match the server's local day). */
function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
