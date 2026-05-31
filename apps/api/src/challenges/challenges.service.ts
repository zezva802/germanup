import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SaveResultDto } from './dto/save-result.dto';
import { Plan } from '@prisma/client';

const CHALLENGE_SLUGS = [
  'the-detective',
  'the-cipher',
  'the-forger',
  'the-decoder',
  'the-echo',
] as const;

function calculateBadge(score: number): string | null {
  if (score >= 920) return 'diamond';
  if (score >= 800) return 'gold';
  if (score >= 650) return 'silver';
  if (score >= 500) return 'bronze';
  return null;
}

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  async getResults(userId: string) {
    const results = await this.prisma.challengeResult.findMany({
      where: { userId },
    });

    return CHALLENGE_SLUGS.map((challengeSlug) => {
      const plays = results.filter((r) => r.challengeSlug === challengeSlug);
      const best = plays.reduce<(typeof plays)[number] | null>(
        (acc, r) => (acc === null || r.score > acc.score ? r : acc),
        null,
      );

      return {
        challengeSlug,
        badge: best?.badge ?? null,
        bestScore: best?.score ?? null,
        playsCount: plays.length,
      };
    });
  }

  async saveResult(userId: string, plan: Plan, dto: SaveResultDto) {
    if (plan !== 'PRO') {
      throw new ForbiddenException('Challenges require a Pro subscription');
    }

    const badge = calculateBadge(dto.score);

    return this.prisma.challengeResult.create({
      data: {
        userId,
        challengeSlug: dto.challengeSlug,
        score: dto.score,
        badge,
      },
    });
  }
}
