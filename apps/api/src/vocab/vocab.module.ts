import { Module } from '@nestjs/common';
import { VocabService } from './vocab.service';
import { VocabController } from './vocab.controller';
import { ClaudeModule } from '../claude/claude.module';

@Module({
  imports: [ClaudeModule],
  providers: [VocabService],
  controllers: [VocabController],
  exports: [VocabService], // reused by WordsModule's ImportService (Wiktionary lookup)
})
export class VocabModule {}
