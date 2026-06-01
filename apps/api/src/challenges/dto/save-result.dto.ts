import { IsString, IsInt, Min, Max } from 'class-validator';

export class SaveResultDto {
  @IsString() challengeSlug: string;
  // Endless mode: cumulative high score is uncapped (kept sane to reject garbage).
  @IsInt() @Min(0) @Max(10000000) score: number;
}
