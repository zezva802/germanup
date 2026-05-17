import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { VerbsService } from './verbs.service';
import { ImportVerbDto } from './dto/import-verb.dto';
import { PracticeSessionDto } from './dto/practice-session.dto';
import { ConjugationResultDto } from './dto/conjugation-result.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('verbs')
export class VerbsController {
  constructor(private verbsService: VerbsService) {}

  @Post('import')
  importVerb(@CurrentUser() user: AuthUser, @Body() dto: ImportVerbDto) {
    return this.verbsService.importVerb(user.id, user.plan, dto);
  }

  @Get()
  getVerbs(@CurrentUser() user: AuthUser) {
    return this.verbsService.getVerbs(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteVerb(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.verbsService.deleteVerb(user.id, id);
  }

  @Get('practice-session')
  getPracticeSession(
    @CurrentUser() user: AuthUser,
    @Query() query: PracticeSessionDto,
  ) {
    return this.verbsService.getPracticeSession(user.id, query);
  }

  @Post('conjugation-result')
  @HttpCode(HttpStatus.OK)
  recordConjugationResult(
    @CurrentUser() user: AuthUser,
    @Body() dto: ConjugationResultDto,
  ) {
    return this.verbsService.recordConjugationResult(user.id, dto);
  }
}
