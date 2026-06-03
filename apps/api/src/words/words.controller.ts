import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { GetWordsDto } from './dto/get-words.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('words')
export class WordsController {
  constructor(private wordsService: WordsService) {}

  @Get()
  getWords(@CurrentUser() user: AuthUser, @Query() query: GetWordsDto) {
    return this.wordsService.getWords(user.id, query);
  }

  @Post()
  createWord(@CurrentUser() user: AuthUser, @Body() dto: CreateWordDto) {
    return this.wordsService.createWord(user.id, dto);
  }

  @Patch(':id')
  updateWord(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateWordDto) {
    return this.wordsService.updateWord(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteWord(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.wordsService.deleteWord(user.id, id);
  }

  @Post(':id/example')
  @HttpCode(HttpStatus.OK)
  generateExample(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.wordsService.generateExample(user.id, user.plan, id);
  }
}
