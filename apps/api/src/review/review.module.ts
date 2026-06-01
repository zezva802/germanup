import { Module } from '@nestjs/common';
import { ReviewService } from './review.service';
import { SrsService } from './srs.service';
import { ReviewController } from './review.controller';
import { WordsStatsController } from './words-stats.controller';

@Module({
  providers: [ReviewService, SrsService],
  controllers: [ReviewController, WordsStatsController],
})
export class ReviewModule {}
