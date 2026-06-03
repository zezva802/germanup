import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartOfSpeech } from '@prisma/client';

export class CuratedWordItem {
  @IsString() @IsNotEmpty() @MaxLength(200) german: string;
  @IsString() @IsNotEmpty() @MaxLength(200) english: string;
  @IsEnum(PartOfSpeech) partOfSpeech: PartOfSpeech;
  @IsString() @IsNotEmpty() @MaxLength(10) level: string;

  @IsOptional() @IsString() @MaxLength(10) gender?: string;
  @IsOptional() @IsString() @MaxLength(100) plural?: string;
  @IsOptional() @IsString() @MaxLength(500) example?: string;
  @IsOptional() @IsObject() conjugation?: Record<string, unknown>;
}

export class ImportCuratedWordsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CuratedWordItem)
  words: CuratedWordItem[];
}
