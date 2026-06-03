import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartOfSpeech } from '@prisma/client';

export class ImportRowDto {
  @IsString()
  @MaxLength(200)
  german: string;

  @IsString()
  @MaxLength(200)
  english: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  gender?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  plural?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  example?: string | null;

  @IsOptional()
  @IsEnum(PartOfSpeech)
  partOfSpeech?: PartOfSpeech;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  level?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  source?: string;

  @IsOptional()
  @IsString()
  status?: string;

  /** Commit this row even if marked duplicate. */
  @IsOptional()
  @IsBoolean()
  override?: boolean;

  /** Echoed back from the preview row; ignored on commit. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldsFilledByAI?: string[];
}

export class ImportCommitDto {
  @IsString()
  deckId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tagIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportRowDto)
  rows: ImportRowDto[];
}
