import { IsString, IsOptional, IsEnum, IsObject, IsArray, MaxLength } from 'class-validator';
import { PartOfSpeech } from '@prisma/client';

export class UpdateWordDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  german?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  english?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  plural?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  example?: string;

  @IsOptional()
  @IsEnum(PartOfSpeech)
  partOfSpeech?: PartOfSpeech;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level?: string;

  @IsOptional()
  @IsObject()
  conjugation?: Record<string, unknown>;

  /** When present, replaces the word's tag set with these (caller-owned) tag ids. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];
}
