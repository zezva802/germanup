import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetExercisesDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  topics?: string; // comma-separated list for challenges

  @IsOptional()
  @IsIn(['EASY', 'MEDIUM', 'HARD', 'mixed'])
  difficulty?: string;

  @IsOptional()
  @IsIn(['FILL_BLANK', 'MULTIPLE_CHOICE', 'TRANSLATE', 'FREE_WRITE', 'SORT', 'BUILD', 'ERROR_SPOT'])
  type?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
