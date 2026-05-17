import { IsString, IsArray } from 'class-validator';

export class CorrectFreewriteDto {
  @IsString()
  topic: string;

  @IsArray()
  @IsString({ each: true })
  requiredElements: string[];

  @IsString()
  studentAnswer: string;
}
