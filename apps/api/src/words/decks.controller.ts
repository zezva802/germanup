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
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { UpdateDeckDto } from './dto/update-deck.dto';
import { GenerateDeckDto } from './dto/generate-deck.dto';
import { ImportDeckDto } from './dto/import-deck.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Plan } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  plan: Plan;
}

@UseGuards(JwtAuthGuard)
@Controller('decks')
export class DecksController {
  constructor(private decksService: DecksService) {}

  @Get()
  getDecks(@CurrentUser() user: AuthUser) {
    return this.decksService.getDecks(user.id);
  }

  @Post()
  createDeck(@CurrentUser() user: AuthUser, @Body() dto: CreateDeckDto) {
    return this.decksService.createDeck(user.id, dto);
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generateDeck(@CurrentUser() user: AuthUser, @Body() dto: GenerateDeckDto) {
    return this.decksService.generateDeck(user.id, user.plan, dto);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  importDeck(@CurrentUser() user: AuthUser, @Body() dto: ImportDeckDto) {
    return this.decksService.importDeck(user.id, dto);
  }

  @Get(':id/export')
  exportDeck(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.decksService.exportDeck(user.id, id);
  }

  @Get(':id')
  getDeck(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.decksService.getDeck(user.id, id);
  }

  @Patch(':id')
  updateDeck(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateDeckDto) {
    return this.decksService.updateDeck(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  deleteDeck(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.decksService.deleteDeck(user.id, id);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  startDeck(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.decksService.startDeck(user.id, id);
  }
}
