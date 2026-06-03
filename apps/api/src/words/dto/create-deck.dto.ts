import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateDeckDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level?: string;
}
