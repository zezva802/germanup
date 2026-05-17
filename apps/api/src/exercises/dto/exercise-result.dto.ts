import { IsString, IsBoolean } from 'class-validator';

export class ExerciseResultDto {
  @IsString()
  exerciseId: string;

  @IsBoolean()
  correct: boolean;

  @IsString()
  topic: string;
}
