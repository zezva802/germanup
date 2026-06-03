import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminDecksController } from './admin-decks.controller';
import { AdminDecksService } from './admin-decks.service';

@Module({
  controllers: [AdminController, AdminDecksController],
  providers: [AdminService, AdminDecksService],
})
export class AdminModule {}
