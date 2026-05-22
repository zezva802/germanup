import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

enum ExTypeDto {
  FILL_BLANK = 'FILL_BLANK',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRANSLATE = 'TRANSLATE',
  FREE_WRITE = 'FREE_WRITE',
  SORT = 'SORT',
  BUILD = 'BUILD',
  ERROR_SPOT = 'ERROR_SPOT',
}

enum DifficultyDto {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export class UpdateExerciseDto {
  @IsOptional() @IsString() @IsNotEmpty() topic?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsEnum(ExTypeDto) type?: ExTypeDto;
  @IsOptional() @IsString() @IsNotEmpty() question?: string;
  @IsOptional() @IsString() @IsNotEmpty() answer?: string;
  @IsOptional() @IsString() @IsNotEmpty() explanation?: string;
  @IsOptional() @IsEnum(DifficultyDto) difficulty?: DifficultyDto;
  @IsOptional() options?: string[] | null;
  @IsOptional() @IsString() imageUrl?: string | null;
}
