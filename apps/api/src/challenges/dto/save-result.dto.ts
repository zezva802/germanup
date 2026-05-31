import { IsString, IsInt, Min, Max } from 'class-validator';

export class SaveResultDto {
  @IsString() challengeSlug: string;
  @IsInt() @Min(0) @Max(1000) score: number;
}
