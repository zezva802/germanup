import { PartOfSpeech } from '@prisma/client';

export interface ParsedEntry {
  german: string;
  gender: 'der' | 'die' | 'das' | null;
  english: string | null;
  partOfSpeech: PartOfSpeech;
}

/** Delimiters that separate the German term from its translation, tried in order. */
const DELIMITERS = [
  '\t',
  ' - ',
  ' – ', // en dash
  ' — ', // em dash
  ';',
  '|',
  '=',
  ',',
];

const ARTICLE_GENDER: Record<string, 'der' | 'die' | 'das'> = {
  der: 'der',
  die: 'die',
  das: 'das',
};

/** Split a line into [germanPart, englishPart?] on the first delimiter that appears. */
function splitOnFirstDelimiter(line: string): [string, string | null] {
  let bestIdx = -1;
  let bestDelim = '';
  for (const d of DELIMITERS) {
    const idx = line.indexOf(d);
    if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
      bestIdx = idx;
      bestDelim = d;
    }
  }
  if (bestIdx === -1) return [line.trim(), null];
  const left = line.slice(0, bestIdx).trim();
  const right = line.slice(bestIdx + bestDelim.length).trim();
  return [left, right || null];
}

/** Strip a leading definite article, returning [gender, remainingGerman]. */
function extractArticle(germanPart: string): ['der' | 'die' | 'das' | null, string] {
  const match = germanPart.match(/^(der|die|das)\s+(.+)$/i);
  if (match) {
    const gender = ARTICLE_GENDER[match[1].toLowerCase()];
    return [gender, match[2].trim()];
  }
  return [null, germanPart];
}

/**
 * Parse a pasted vocabulary list of mixed formats into structured entries.
 * Handles: `Hund`, `der Hund`, `Hund - dog`, `der Hund, dog`, CSV, tab-separated.
 * Pure and side-effect free — unit tested in import-parser.spec.ts.
 */
export function parseImportText(text: string): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const [germanPart, english] = splitOnFirstDelimiter(line);
    const [gender, german] = extractArticle(germanPart);
    if (!german) continue;

    entries.push({
      german,
      gender,
      english: english,
      partOfSpeech: gender ? PartOfSpeech.NOUN : PartOfSpeech.OTHER,
    });
  }
  return entries;
}
