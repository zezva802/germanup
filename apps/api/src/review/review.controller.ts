import { Controller, Get, Post, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ReviewService } from './review.service';
import { GetQueueDto } from './dto/get-queue.dto';
import { SaveGradeDto } from './dto/save-grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('review')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Get('queue')
  getQueue(@CurrentUser() user: AuthUser, @Query() query: GetQueueDto) {
    return this.reviewService.getQueue(user.id, user.plan, query.deck);
  }

  @Post('grade')
  @HttpCode(HttpStatus.OK)
  grade(@CurrentUser() user: AuthUser, @Body() dto: SaveGradeDto) {
    return this.reviewService.grade(user.id, dto);
  }
}
