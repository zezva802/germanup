import { IsArray, IsString, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class ImportWordsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  words: string[];
}
