import { IsString, IsOptional, IsEnum, IsObject, MaxLength } from 'class-validator';
import { PartOfSpeech } from '@prisma/client';

export class CreateWordDto {
  @IsString()
  deckId: string;

  @IsString()
  @MaxLength(200)
  german: string;

  @IsString()
  @MaxLength(200)
  english: string;

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
}
