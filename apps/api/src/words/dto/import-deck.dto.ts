import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsArray,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartOfSpeech } from '@prisma/client';

export class ImportDeckWordDto {
  @IsString() @IsNotEmpty() @MaxLength(200) german: string;
  @IsString() @IsNotEmpty() @MaxLength(200) english: string;

  @IsOptional() @IsString() @MaxLength(10) gender?: string | null;
  @IsOptional() @IsString() @MaxLength(100) plural?: string | null;
  @IsOptional() @IsString() @MaxLength(500) example?: string | null;
  @IsOptional() @IsEnum(PartOfSpeech) partOfSpeech?: PartOfSpeech;
  @IsOptional() @IsString() @MaxLength(10) level?: string;
  @IsOptional() @IsObject() conjugation?: Record<string, unknown>;
}

/** Accepts a deck export envelope (DOG-120). The version marker is optional and ignored. */
export class ImportDeckDto {
  @IsOptional() @IsNumber() germanupDeck?: number;

  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(60) topic?: string;
  @IsOptional() @IsString() @MaxLength(10) level?: string;

  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ImportDeckWordDto)
  words: ImportDeckWordDto[];
}
