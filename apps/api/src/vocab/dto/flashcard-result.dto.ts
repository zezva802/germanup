import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class FlashcardResultDto {
  @IsString()
  @IsNotEmpty()
  wordId: string;

  @IsBoolean()
  knew: boolean;
}
