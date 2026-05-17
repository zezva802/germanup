import { IsString, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

enum ExTypeDto {
  FILL_BLANK = 'FILL_BLANK',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  IDENTIFY = 'IDENTIFY',
  TRANSLATE = 'TRANSLATE',
  FREE_WRITE = 'FREE_WRITE',
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
}
