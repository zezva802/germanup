import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { SaveResultDto } from './dto/save-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @Get('results')
  getResults(@CurrentUser() user: AuthUser) {
    return this.challengesService.getResults(user.id);
  }

  @Post('result')
  saveResult(@CurrentUser() user: AuthUser, @Body() dto: SaveResultDto) {
    return this.challengesService.saveResult(user.id, user.plan, dto);
  }
}
