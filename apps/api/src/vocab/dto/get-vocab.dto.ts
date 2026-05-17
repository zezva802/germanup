import { IsOptional, IsString, IsIn, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetVocabDto {
  @IsOptional()
  @IsIn(['A1', 'A2', 'A3'])
  level?: string;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }: { value: string }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
