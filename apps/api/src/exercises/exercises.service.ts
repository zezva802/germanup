import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeService } from '../claude/claude.service';
import { GetExercisesDto } from './dto/get-exercises.dto';
import { ExerciseResultDto } from './dto/exercise-result.dto';
import { CorrectTranslationDto } from './dto/correct-translation.dto';
import { CorrectFreewriteDto } from './dto/correct-freewrite.dto';
import { Plan, Difficulty, ExType } from '@prisma/client';
import { A1_TOPICS } from '../common/constants';

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private claude: ClaudeService,
  ) {}

  async getExercises(userId: string, userPlan: Plan, dto: GetExercisesDto) {
    const limit = dto.limit ?? 10;

    // Free tier: cap at 10 exercises per day
    if (userPlan === 'FREE') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const doneToday = await this.prisma.practiceSession.count({
        where: { userId, type: 'grammar', createdAt: { gte: todayStart } },
      });
      if (doneToday >= 10) {
        throw new ForbiddenException('Free plan allows 10 exercises per day. Upgrade to Pro for unlimited access.');
      }
    }

    const where: {
      topic?: string | { in: string[] };
      difficulty?: Difficulty;
      type?: ExType;
    } = {};

    if (dto.topics) {
      where.topic = { in: dto.topics.split(',').map((t) => t.trim()).filter(Boolean) };
    } else if (dto.topic) {
      where.topic = dto.topic;
    }
    if (dto.type) where.type = dto.type as ExType;
    if (dto.difficulty && dto.difficulty !== 'mixed') {
      where.difficulty = dto.difficulty as Difficulty;
    }

    // Fetch extra to allow shuffle-then-slice; prioritise less-shown exercises
    const exercises = await this.prisma.exercise.findMany({
      where,
      take: limit * 5,
      orderBy: { timesShown: 'asc' },
    });

    // Fisher-Yates shuffle, then take limit
    for (let i = exercises.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [exercises[i], exercises[j]] = [exercises[j], exercises[i]];
    }

    return exercises.slice(0, limit);
  }

  async recordResult(userId: string, dto: ExerciseResultDto) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: dto.exerciseId },
    });
    if (!exercise) throw new NotFoundException('Exercise not found');

    const now = new Date();

    const XP_MAP: Record<string, number> = {
      FILL_BLANK: 12,
      MULTIPLE_CHOICE: 8,
      IDENTIFY: 8,
      TRANSLATE: 20,
      FREE_WRITE: 30,
    };
    const DIFFICULTY_MULT: Record<string, number> = {
      EASY: 1,
      MEDIUM: 1.5,
      HARD: 2,
    };
    const xpEarned = dto.correct
      ? Math.round((XP_MAP[exercise.type] ?? 8) * (DIFFICULTY_MULT[exercise.difficulty] ?? 1))
      : 0;

    // Update exercise-level stats
    await this.prisma.exercise.update({
      where: { id: dto.exerciseId },
      data: {
        timesShown: { increment: 1 },
        ...(dto.correct ? { timesCorrect: { increment: 1 } } : {}),
      },
    });

    // Record individual exercise as a PracticeSession for daily tracking
    await this.prisma.practiceSession.create({
      data: {
        userId,
        type: 'grammar',
        topic: dto.topic,
        score: dto.correct ? 1 : 0,
        total: 1,
        duration: 0,
      },
    });

    // Upsert TopicProgress for this user+topic
    const existing = await this.prisma.topicProgress.findUnique({
      where: { userId_topic_level: { userId, topic: dto.topic, level: 'A1' } },
    });

    let newXp: number;
    if (existing) {
      const updated = await this.prisma.topicProgress.update({
        where: { id: existing.id },
        data: {
          exercisesDone: { increment: 1 },
          ...(dto.correct ? { correctCount: { increment: 1 } } : {}),
          xp: { increment: xpEarned },
          lastPracticed: now,
        },
      });
      newXp = updated.xp;
    } else {
      const created = await this.prisma.topicProgress.create({
        data: {
          userId,
          topic: dto.topic,
          level: 'A1',
          exercisesDone: 1,
          correctCount: dto.correct ? 1 : 0,
          xp: xpEarned,
          lastPracticed: now,
          unlocked: true,
        },
      });
      newXp = created.xp;
    }

    // Unlock next topic when reaching Learner rank (150 XP) — only fire once
    let unlocked = false;
    if (newXp >= 150) {
      const topicIndex = A1_TOPICS.indexOf(dto.topic as (typeof A1_TOPICS)[number]);
      if (topicIndex !== -1 && topicIndex + 1 < A1_TOPICS.length) {
        const nextTopic = A1_TOPICS[topicIndex + 1];
        const nextProgress = await this.prisma.topicProgress.findUnique({
          where: { userId_topic_level: { userId, topic: nextTopic, level: 'A1' } },
        });
        const alreadyUnlocked = nextProgress?.unlocked ?? false;
        if (!alreadyUnlocked) {
          await this.prisma.topicProgress.upsert({
            where: { userId_topic_level: { userId, topic: nextTopic, level: 'A1' } },
            create: { userId, topic: nextTopic, level: 'A1', exercisesDone: 0, correctCount: 0, xp: 0, unlocked: true },
            update: { unlocked: true },
          });
          unlocked = true;
        }
      }
    }

    // Streak update: check if today's exercise count just hit 10
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayCount = await this.prisma.practiceSession.count({
      where: { userId, type: 'grammar', createdAt: { gte: todayStart } },
    });

    let streakUpdated = false;
    if (todayCount === 10) {
      // Crossed the daily threshold — update streak
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { streakCount: true, lastActiveDate: true },
      });

      if (user) {
        const yesterday = new Date(todayStart);
        yesterday.setDate(yesterday.getDate() - 1);

        const wasActiveYesterday =
          user.lastActiveDate !== null &&
          new Date(user.lastActiveDate).getTime() >= yesterday.getTime() &&
          new Date(user.lastActiveDate).getTime() < todayStart.getTime();

        const newStreak = wasActiveYesterday ? user.streakCount + 1 : 1;

        await this.prisma.user.update({
          where: { id: userId },
          data: { streakCount: newStreak, lastActiveDate: todayStart },
        });
        streakUpdated = true;
      }
    }

    return { success: true, unlockedNextTopic: unlocked, streakUpdated };
  }

  async correctTranslation(userId: string, userPlan: Plan, dto: CorrectTranslationDto) {
    if (userPlan !== 'PRO') {
      throw new ForbiddenException('AI correction requires a Pro subscription');
    }
    await this.checkAndIncrementDailyUsage(userId, 'correct-translation', 50);
    return this.claude.correctTranslation(dto.topic, dto.task, dto.studentAnswer);
  }

  async correctFreewrite(userId: string, userPlan: Plan, dto: CorrectFreewriteDto) {
    if (userPlan !== 'PRO') {
      throw new ForbiddenException('AI correction requires a Pro subscription');
    }
    await this.checkAndIncrementDailyUsage(userId, 'correct-freewrite', 30);
    return this.claude.correctFreeWrite(dto.topic, dto.task ?? '', dto.requiredElements, dto.studentAnswer);
  }

  async correctTranslationStream(userId: string, userPlan: Plan, dto: CorrectTranslationDto, res: import('express').Response): Promise<void> {
    if (userPlan !== 'PRO') throw new ForbiddenException('AI correction requires a Pro subscription');
    await this.checkAndIncrementDailyUsage(userId, 'correct-translation', 50);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.claude.correctTranslationStream(dto.topic, dto.task, dto.studentAnswer)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch {
      res.write('data: [ERROR]\n\n');
    } finally {
      res.end();
    }
  }

  async correctFreewriteStream(userId: string, userPlan: Plan, dto: CorrectFreewriteDto, res: import('express').Response): Promise<void> {
    if (userPlan !== 'PRO') throw new ForbiddenException('AI correction requires a Pro subscription');
    await this.checkAndIncrementDailyUsage(userId, 'correct-freewrite', 30);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      for await (const chunk of this.claude.correctFreeWriteStream(dto.topic, dto.task ?? '', dto.requiredElements, dto.studentAnswer)) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
    } catch {
      res.write('data: [ERROR]\n\n');
    } finally {
      res.end();
    }
  }

  private async checkAndIncrementDailyUsage(userId: string, endpoint: string, limit: number) {
    const today = new Date().toISOString().slice(0, 10);
    const row = await this.prisma.dailyApiUsage.upsert({
      where: { userId_date_endpoint: { userId, date: today, endpoint } },
      create: { userId, date: today, endpoint, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (row.count > limit) {
      throw new ForbiddenException(`Daily limit reached for this feature. Try again tomorrow.`);
    }
  }
}
