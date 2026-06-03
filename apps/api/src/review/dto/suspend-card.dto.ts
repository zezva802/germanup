import { IsString, IsBoolean } from 'class-validator';

export class SuspendCardDto {
  @IsString()
  wordId: string;

  @IsBoolean()
  suspended: boolean;
}
