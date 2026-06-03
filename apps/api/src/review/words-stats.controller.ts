import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

/**
 * Hosts GET /words/stats (DOG-103). The broader /words CRUD controller arrives
 * in DOG-104; keeping stats here lets the review backbone ship independently.
 */
@UseGuards(JwtAuthGuard)
@Controller('words')
export class WordsStatsController {
  constructor(private reviewService: ReviewService) {}

  @Get('stats')
  getStats(@CurrentUser() user: AuthUser) {
    return this.reviewService.getStats(user.id);
  }

  /** Pro-gated advanced metrics (DOG-115): retention, due forecast, leeches. */
  @Get('stats/advanced')
  getAdvancedStats(@CurrentUser() user: AuthUser) {
    return this.reviewService.getAdvancedStats(user.id, user.plan);
  }
}
