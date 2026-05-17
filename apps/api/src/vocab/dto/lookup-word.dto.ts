import { IsString, IsNotEmpty } from 'class-validator';

export class LookupWordDto {
  @IsString()
  @IsNotEmpty()
  word: string;
}
