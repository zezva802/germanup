import { Module } from '@nestjs/common';
import { VerbsService } from './verbs.service';
import { VerbsController } from './verbs.controller';
import { ClaudeModule } from '../claude/claude.module';

@Module({
  imports: [ClaudeModule],
  providers: [VerbsService],
  controllers: [VerbsController],
})
export class VerbsModule {}
