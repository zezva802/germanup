import { Module } from '@nestjs/common';
import { DecksService } from './decks.service';
import { DecksController } from './decks.controller';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';

@Module({
  providers: [DecksService, WordsService, TagsService],
  controllers: [DecksController, WordsController, TagsController],
})
export class WordsModule {}
