import { IsString, MinLength, MaxLength } from 'class-validator';

export class ImportVerbDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  infinitive: string;
}
