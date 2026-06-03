import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDecksController } from './admin-decks.controller';
import { AdminDecksService } from './admin-decks.service';
import { TtsModule } from '../tts/tts.module';

@Module({
  imports: [TtsModule],
  controllers: [AdminController, AdminDecksController],
  providers: [AdminService, AdminDecksService],
})
export class AdminModule {}
