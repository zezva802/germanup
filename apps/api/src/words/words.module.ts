import { Module } from '@nestjs/common';
import { DecksService } from './decks.service';
import { DecksController } from './decks.controller';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ClaudeModule } from '../claude/claude.module';
import { VocabModule } from '../vocab/vocab.module';

@Module({
  imports: [ClaudeModule, VocabModule],
  providers: [DecksService, WordsService, TagsService, ImportService],
  controllers: [DecksController, WordsController, TagsController, ImportController],
})
export class WordsModule {}
