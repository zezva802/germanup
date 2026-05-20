import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Plan } from '@prisma/client';
import { A1_TOPICS } from '../common/constants';

const RANKS = [
  { min: 1500, name: 'Mastered', emoji: '🏆' },
  { min: 800, name: 'Confident', emoji: '🔥' },
  { min: 400, name: 'Practiced', emoji: '⚡' },
  { min: 150, name: 'Learner', emoji: '📖' },
  { min: 0, name: 'Beginner', emoji: '🌱' },
] as const;

function getRank(xp: number) {
  return RANKS.find((r) => xp >= r.min) ?? RANKS[RANKS.length - 1];
}

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getAllProgress(userId: string) {
    const [rows, user] = await Promise.all([
      this.prisma.topicProgress.findMany({ where: { userId, level: 'A1' } }),
      this.prisma.user.findUnique({ where: { id: userId }, select: { streakCount: true } }),
    ]);

    const progressMap = new Map(rows.map((r) => [r.topic, r]));

    const topics = A1_TOPICS.map((slug, index) => {
      const row = progressMap.get(slug);
      const isFirstThree = index < 3;
      const xp = row?.xp ?? 0;
      const rank = getRank(xp);
      return {
        topic: slug,
        level: 'A1',
        exercisesDone: row?.exercisesDone ?? 0,
        correctCount: row?.correctCount ?? 0,
        lastPracticed: row?.lastPracticed ?? null,
        unlocked: row?.unlocked ?? isFirstThree,
        xp,
        rank: rank.name,
        rankEmoji: rank.emoji,
      };
    });

    // Use stored streak from User model (updated in real-time by exercises)
    const streak = user?.streakCount ?? 0;

    // Calendar: last 30 days with at least one session
    const calendarDays = await this.getPracticeCalendar(userId);

    const totalDone = topics.reduce((s, t) => s + t.exercisesDone, 0);
    const totalXp = topics.reduce((s, t) => s + t.xp, 0);

    return {
      topics,
      streak,
      calendarDays,
      totalExercisesDone: totalDone,
      totalXp,
    };
  }

  async getTodayStats(userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const exercisesToday = await this.prisma.practiceSession.count({
      where: { userId, type: 'grammar', createdAt: { gte: todayStart } },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, lastActiveDate: true, plan: true, streakFreezeUsedAt: true },
    });

    const DAILY_GOAL = 20;
    const streakCount = user?.streakCount ?? 0;

    // Determine if Pro user has a freeze available this week
    let freezeAvailable = false;
    if (user?.plan === 'PRO') {
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
      freezeAvailable =
        !user.streakFreezeUsedAt || new Date(user.streakFreezeUsedAt) < weekStart;
    }

    return {
      exercisesToday,
      dailyGoal: DAILY_GOAL,
      goalReached: exercisesToday >= DAILY_GOAL,
      streakCount,
      freezeAvailable,
    };
  }

  async freezeStreak(userId: string, userPlan: Plan) {
    if (userPlan !== 'PRO') {
      throw new ForbiddenException('Streak freeze requires a Pro subscription');
    }

    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streakFreezeUsedAt: true },
    });

    if (user?.streakFreezeUsedAt && new Date(user.streakFreezeUsedAt) >= weekStart) {
      throw new ForbiddenException('Streak freeze already used this week');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { streakFreezeUsedAt: new Date() },
    });

    return { success: true };
  }

  async getTopicProgress(userId: string, topic: string) {
    const row = await this.prisma.topicProgress.findUnique({
      where: { userId_topic_level: { userId, topic, level: 'A1' } },
    });

    const topicIndex = A1_TOPICS.indexOf(topic as (typeof A1_TOPICS)[number]);
    const isFirstThree = topicIndex >= 0 && topicIndex < 3;

    const xp = row?.xp ?? 0;
    const rank = getRank(xp);
    return {
      topic,
      level: 'A1',
      exercisesDone: row?.exercisesDone ?? 0,
      correctCount: row?.correctCount ?? 0,
      lastPracticed: row?.lastPracticed ?? null,
      unlocked: row?.unlocked ?? isFirstThree,
      xp,
      rank: rank.name,
      rankEmoji: rank.emoji,
    };
  }

  private async getPracticeCalendar(userId: string): Promise<string[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.prisma.practiceSession.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Supplement with TopicProgress.lastPracticed
    const topicDates = await this.prisma.topicProgress.findMany({
      where: {
        userId,
        lastPracticed: { gte: thirtyDaysAgo },
      },
      select: { lastPracticed: true },
    });

    const daySet = new Set<string>();

    for (const s of sessions) {
      daySet.add(s.createdAt.toISOString().slice(0, 10));
    }
    for (const t of topicDates) {
      if (t.lastPracticed) {
        daySet.add(t.lastPracticed.toISOString().slice(0, 10));
      }
    }

    return Array.from(daySet).sort();
  }
}
