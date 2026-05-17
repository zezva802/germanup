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
  ForbiddenException,
} from '@nestjs/common';
import { VocabService } from './vocab.service';
import { ImportWordsDto } from './dto/import-words.dto';
import { GetVocabDto } from './dto/get-vocab.dto';
import { FlashcardResultDto } from './dto/flashcard-result.dto';
import { FlashcardSessionDto } from './dto/flashcard-session.dto';
import { LookupWordDto } from './dto/lookup-word.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('vocab')
export class VocabController {
  constructor(private vocabService: VocabService) {}

  @Get('lookup')
  lookupWord(@Query('word') word: string) {
    return this.vocabService.lookupWord(word);
  }

  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  addWord(
    @CurrentUser() user: AuthUser,
    @Body() dto: { german: string; english: string; level: string; gender?: string; plural?: string },
  ) {
    return this.vocabService.addWord(user.id, dto);
  }

  @Post('import')
  importWords(@CurrentUser() user: AuthUser, @Body() dto: ImportWordsDto) {
    return this.vocabService.importWords(user.id, user.plan, dto);
  }

  @Get()
  getVocab(@CurrentUser() user: AuthUser, @Query() query: GetVocabDto) {
    return this.vocabService.getVocab(user.id, query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteWord(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.vocabService.deleteWord(user.id, id);
  }

  @Get('flashcard-session')
  getFlashcardSession(
    @CurrentUser() user: AuthUser,
    @Query() query: FlashcardSessionDto,
  ) {
    return this.vocabService.getFlashcardSession(user.id, user.plan, query);
  }

  @Post('flashcard-result')
  @HttpCode(HttpStatus.OK)
  recordFlashcardResult(
    @CurrentUser() user: AuthUser,
    @Body() dto: FlashcardResultDto,
  ) {
    return this.vocabService.recordFlashcardResult(user.id, dto);
  }
}
