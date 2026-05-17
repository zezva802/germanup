import { Controller, Get, Post, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get()
  getAllProgress(@CurrentUser() user: AuthUser) {
    return this.progressService.getAllProgress(user.id);
  }

  @Get('today')
  getTodayStats(@CurrentUser() user: AuthUser) {
    return this.progressService.getTodayStats(user.id);
  }

  @Post('streak-freeze')
  @HttpCode(HttpStatus.OK)
  freezeStreak(@CurrentUser() user: AuthUser) {
    return this.progressService.freezeStreak(user.id, user.plan);
  }

  @Get(':topic')
  getTopicProgress(@CurrentUser() user: AuthUser, @Param('topic') topic: string) {
    return this.progressService.getTopicProgress(user.id, topic);
  }
}
