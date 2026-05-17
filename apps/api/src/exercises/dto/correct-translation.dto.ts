import { IsString } from 'class-validator';

export class CorrectTranslationDto {
  @IsString()
  topic: string;

  @IsString()
  task: string;

  @IsString()
  studentAnswer: string;
}
