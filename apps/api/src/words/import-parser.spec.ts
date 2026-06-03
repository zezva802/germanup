import { PartOfSpeech } from '@prisma/client';
import { parseImportText } from './import-parser';

describe('parseImportText', () => {
  it('parses a bare German word', () => {
    expect(parseImportText('Hund')).toEqual([
      { german: 'Hund', gender: null, english: null, partOfSpeech: PartOfSpeech.OTHER },
    ]);
  });

  it('parses a word with a leading article into gender + NOUN', () => {
    expect(parseImportText('der Hund')).toEqual([
      { german: 'Hund', gender: 'der', english: null, partOfSpeech: PartOfSpeech.NOUN },
    ]);
  });

  it('parses "Hund - dog" (dash-separated translation)', () => {
    expect(parseImportText('Hund - dog')).toEqual([
      { german: 'Hund', gender: null, english: 'dog', partOfSpeech: PartOfSpeech.OTHER },
    ]);
  });

  it('parses "der Hund, dog" (article + CSV translation)', () => {
    expect(parseImportText('der Hund, dog')).toEqual([
      { german: 'Hund', gender: 'der', english: 'dog', partOfSpeech: PartOfSpeech.NOUN },
    ]);
  });

  it('parses tab-separated rows', () => {
    expect(parseImportText('die Katze\tcat')).toEqual([
      { german: 'Katze', gender: 'die', english: 'cat', partOfSpeech: PartOfSpeech.NOUN },
    ]);
  });

  it('handles multiple lines and skips blanks', () => {
    const rows = parseImportText('der Hund, dog\n\n  \nlaufen - to run\n');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ german: 'Hund', gender: 'der', english: 'dog', partOfSpeech: PartOfSpeech.NOUN });
    expect(rows[1]).toEqual({ german: 'laufen', gender: null, english: 'to run', partOfSpeech: PartOfSpeech.OTHER });
  });

  it('is case-insensitive on the article but keeps the German term as written', () => {
    expect(parseImportText('DAS Auto')).toEqual([
      { german: 'Auto', gender: 'das', english: null, partOfSpeech: PartOfSpeech.NOUN },
    ]);
  });

  it('splits on the first delimiter only (translation may contain commas)', () => {
    expect(parseImportText('das Haus = house, building')).toEqual([
      { german: 'Haus', gender: 'das', english: 'house, building', partOfSpeech: PartOfSpeech.NOUN },
    ]);
  });

  it('does not mistake a non-article first word for a gender', () => {
    const [row] = parseImportText('schnell - fast');
    expect(row).toEqual({ german: 'schnell', gender: null, english: 'fast', partOfSpeech: PartOfSpeech.OTHER });
  });

  it('drops a line with an article but no term', () => {
    expect(parseImportText('der ')).toEqual([
      { german: 'der', gender: null, english: null, partOfSpeech: PartOfSpeech.OTHER },
    ]);
  });
});
