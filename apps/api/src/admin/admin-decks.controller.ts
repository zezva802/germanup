import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminDecksService } from './admin-decks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { CreateCuratedDeckDto } from './dto/create-curated-deck.dto';
import { UpdateCuratedDeckDto } from './dto/update-curated-deck.dto';
import { ImportCuratedWordsDto } from './dto/import-curated-words.dto';

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/decks')
export class AdminDecksController {
  constructor(private adminDecksService: AdminDecksService) {}

  @Get()
  listDecks() {
    return this.adminDecksService.listDecks();
  }

  @Post()
  createDeck(@Body() dto: CreateCuratedDeckDto) {
    return this.adminDecksService.createDeck(dto);
  }

  @Patch(':id')
  updateDeck(@Param('id') id: string, @Body() dto: UpdateCuratedDeckDto) {
    return this.adminDecksService.updateDeck(id, dto);
  }

  @Delete(':id/words')
  @HttpCode(HttpStatus.OK)
  clearWords(@Param('id') id: string) {
    return this.adminDecksService.clearWords(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteDeck(@Param('id') id: string) {
    return this.adminDecksService.deleteDeck(id);
  }

  @Post(':id/words/import')
  importWords(@Param('id') id: string, @Body() dto: ImportCuratedWordsDto) {
    return this.adminDecksService.importWords(id, dto);
  }
}
