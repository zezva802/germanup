import { IsString, IsOptional, IsInt, Min, Max, MaxLength, IsNotEmpty } from 'class-validator';

export class GenerateDeckDto {
  /** Theme of the deck, e.g. "kitchen vocabulary". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  topic: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level?: string;

  /** Number of words to generate (clamped server-side). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  count?: number;
}
