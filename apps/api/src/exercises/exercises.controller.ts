import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { GetExercisesDto } from './dto/get-exercises.dto';
import { ExerciseResultDto } from './dto/exercise-result.dto';
import { CorrectTranslationDto } from './dto/correct-translation.dto';
import { CorrectFreewriteDto } from './dto/correct-freewrite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Get()
  getExercises(@CurrentUser() user: AuthUser, @Query() query: GetExercisesDto) {
    return this.exercisesService.getExercises(user.id, user.plan, query);
  }

  @Post('result')
  @HttpCode(HttpStatus.OK)
  recordResult(@CurrentUser() user: AuthUser, @Body() dto: ExerciseResultDto) {
    return this.exercisesService.recordResult(user.id, dto);
  }

  @Post('correct-translation')
  @HttpCode(HttpStatus.OK)
  correctTranslation(@CurrentUser() user: AuthUser, @Body() dto: CorrectTranslationDto) {
    return this.exercisesService.correctTranslation(user.id, user.plan, dto);
  }

  @Post('correct-freewrite')
  @HttpCode(HttpStatus.OK)
  correctFreewrite(@CurrentUser() user: AuthUser, @Body() dto: CorrectFreewriteDto) {
    return this.exercisesService.correctFreewrite(user.id, user.plan, dto);
  }

  @Post('correct-translation/stream')
  async correctTranslationStream(
    @CurrentUser() user: AuthUser,
    @Body() dto: CorrectTranslationDto,
    @Res() res: import('express').Response,
  ) {
    await this.exercisesService.correctTranslationStream(user.id, user.plan, dto, res);
  }

  @Post('correct-freewrite/stream')
  async correctFreewriteStream(
    @CurrentUser() user: AuthUser,
    @Body() dto: CorrectFreewriteDto,
    @Res() res: import('express').Response,
  ) {
    await this.exercisesService.correctFreewriteStream(user.id, user.plan, dto, res);
  }
}
