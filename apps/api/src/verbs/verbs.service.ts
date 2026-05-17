import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClaudeService } from '../claude/claude.service';
import { ImportVerbDto } from './dto/import-verb.dto';
import { PracticeSessionDto } from './dto/practice-session.dto';
import { ConjugationResultDto } from './dto/conjugation-result.dto';
import { Plan } from '@prisma/client';

const PRONOUNS = ['ich', 'du', 'er', 'wir', 'ihr', 'sie'] as const;

@Injectable()
export class VerbsService {
  constructor(
    private prisma: PrismaService,
    private claude: ClaudeService,
  ) {}

  async importVerb(userId: string, userPlan: Plan, dto: ImportVerbDto) {
    if (userPlan !== 'PRO') {
      throw new ForbiddenException('Verb import requires a Pro subscription');
    }

    await this.checkAndIncrementDailyUsage(userId, 'verbs/import', 20);

    const data = await this.claude.importVerb(dto.infinitive);

    const verb = await this.prisma.userVerb.create({
      data: {
        userId,
        infinitive: data.infinitive,
        isIrregular: data.isIrregular,
        praesens: data.praesens as object,
        imperfekt: data.imperfekt as object,
        partizip2: data.partizip2,
        hilfsverb: data.hilfsverb,
        example: data.example,
        conjugationStats: {
          create: PRONOUNS.flatMap((pronoun) => [
            { pronoun, tense: 'praesens' },
            { pronoun, tense: 'imperfekt' },
          ]),
        },
      },
      include: { conjugationStats: true },
    });

    return verb;
  }

  async getVerbs(userId: string) {
    return this.prisma.userVerb.findMany({
      where: { userId },
      include: { conjugationStats: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteVerb(userId: string, verbId: string) {
    const verb = await this.prisma.userVerb.findFirst({
      where: { id: verbId, userId },
    });
    if (!verb) throw new NotFoundException('Verb not found');

    await this.prisma.userVerb.delete({ where: { id: verbId } });
    return { message: 'Deleted successfully' };
  }

  async getPracticeSession(userId: string, dto: PracticeSessionDto) {
    const tense = dto.tense ?? 'praesens';

    const verbs = await this.prisma.userVerb.findMany({
      where: { id: { in: dto.verbIds }, userId, isIrregular: true },
      include: { conjugationStats: true },
    });

    const items: Array<{
      verbId: string;
      infinitive: string;
      pronoun: string;
      tense: string;
      answer: string;
    }> = [];

    for (const verb of verbs) {
      const tenses = tense === 'both' ? ['praesens', 'imperfekt'] : [tense];

      for (const t of tenses) {
        const conjugations = verb[t as 'praesens' | 'imperfekt'] as Record<string, string>;

        const pronounsWithStats = PRONOUNS.map((pronoun) => {
          const stat = verb.conjugationStats.find(
            (s) => s.pronoun === pronoun && s.tense === t,
          );
          const correctPct = stat && stat.attempts > 0
            ? stat.correct / stat.attempts
            : 0;
          return { pronoun, correctPct, answer: conjugations[pronoun] };
        });

        // Sort ascending by correct% (weakest first)
        pronounsWithStats.sort((a, b) => a.correctPct - b.correctPct);

        for (const { pronoun, answer } of pronounsWithStats) {
          items.push({ verbId: verb.id, infinitive: verb.infinitive, pronoun, tense: t, answer });
        }
      }
    }

    return items;
  }

  async recordConjugationResult(userId: string, dto: ConjugationResultDto) {
    const verb = await this.prisma.userVerb.findFirst({
      where: { id: dto.verbId, userId },
    });
    if (!verb) throw new NotFoundException('Verb not found');

    const stat = await this.prisma.conjugationStat.findFirst({
      where: { verbId: dto.verbId, pronoun: dto.pronoun, tense: dto.tense },
    });

    if (stat) {
      await this.prisma.conjugationStat.update({
        where: { id: stat.id },
        data: {
          attempts: { increment: 1 },
          ...(dto.correct ? { correct: { increment: 1 } } : {}),
        },
      });
    } else {
      await this.prisma.conjugationStat.create({
        data: {
          verbId: dto.verbId,
          pronoun: dto.pronoun,
          tense: dto.tense,
          attempts: 1,
          correct: dto.correct ? 1 : 0,
        },
      });
    }

    return { success: true };
  }

  private async checkAndIncrementDailyUsage(userId: string, endpoint: string, limit: number) {
    const today = new Date().toISOString().slice(0, 10);
    const row = await this.prisma.dailyApiUsage.upsert({
      where: { userId_date_endpoint: { userId, date: today, endpoint } },
      create: { userId, date: today, endpoint, count: 1 },
      update: { count: { increment: 1 } },
    });
    if (row.count > limit) {
      throw new ForbiddenException('Daily import limit reached. Try again tomorrow.');
    }
  }
}
