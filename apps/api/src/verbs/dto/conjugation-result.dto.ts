import { IsString, IsBoolean, IsIn } from 'class-validator';

export class ConjugationResultDto {
  @IsString()
  verbId: string;

  @IsString()
  @IsIn(['ich', 'du', 'er', 'wir', 'ihr', 'sie'])
  pronoun: string;

  @IsString()
  @IsIn(['praesens', 'imperfekt'])
  tense: string;

  @IsBoolean()
  correct: boolean;
}
