import { IsArray, ValidateNested, IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

enum ExTypeDto {
  FILL_BLANK = 'FILL_BLANK',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRANSLATE = 'TRANSLATE',
  FREE_WRITE = 'FREE_WRITE',
}

enum DifficultyDto {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class ExerciseImportItem {
  @IsString() @IsNotEmpty() topic: string;
  @IsString() @IsNotEmpty() level: string;
  @IsEnum(ExTypeDto) type: ExTypeDto;
  @IsString() @IsNotEmpty() question: string;
  @IsString() @IsNotEmpty() answer: string;
  @IsString() @IsNotEmpty() explanation: string;
  @IsEnum(DifficultyDto) difficulty: DifficultyDto;
  @IsOptional() options?: string[] | null;
  @IsOptional() @IsString() imageUrl?: string | null;
}

export class ImportExercisesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseImportItem)
  exercises: ExerciseImportItem[];
}
