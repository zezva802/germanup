import { IsArray, IsOptional, IsString, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class PracticeSessionDto {
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }) =>
    Array.isArray(value) ? value : [value],
  )
  verbIds: string[];

  @IsOptional()
  @IsIn(['praesens', 'imperfekt', 'both'])
  tense?: 'praesens' | 'imperfekt' | 'both';
}
