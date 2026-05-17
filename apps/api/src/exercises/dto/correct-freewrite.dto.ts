import { IsString, IsArray, IsOptional } from 'class-validator';

export class CorrectFreewriteDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsString()
  task?: string;

  @IsArray()
  @IsString({ each: true })
  requiredElements: string[];

  @IsString()
  studentAnswer: string;
}
