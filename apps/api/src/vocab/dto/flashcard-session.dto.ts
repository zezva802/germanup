import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class FlashcardSessionDto {
  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 20;

  @IsOptional()
  @IsIn(['A1', 'A2', 'A3'])
  level?: string;
}
