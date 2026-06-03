import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ImportPreviewDto {
  @IsString()
  @MaxLength(20000)
  text: string;

  /** Optional target deck — used to flag rows already present in that deck. */
  @IsOptional()
  @IsString()
  deckId?: string;
}
