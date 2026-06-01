import { IsString, IsEnum, IsIn } from 'class-validator';
import { ReviewGrade } from '@prisma/client';

export class SaveGradeDto {
  @IsString()
  wordId: string;

  @IsEnum(ReviewGrade)
  grade: ReviewGrade;

  @IsString()
  @IsIn(['flashcard', 'type', 'listening'])
  mode: string;
}
