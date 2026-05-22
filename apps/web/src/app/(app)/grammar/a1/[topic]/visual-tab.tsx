'use client';

const PREPOSITION_DATA: Record<string, { german: string; english: string; example: string }[]> = {
  'dativ-prepositions': [
    { german: 'mit', english: 'with', example: 'Ich fahre mit dem Bus.' },
    { german: 'nach', english: 'after / to', example: 'Ich gehe nach Hause.' },
    { german: 'bei', english: 'at / near', example: 'Ich bin bei meiner Freundin.' },
    { german: 'seit', english: 'since / for', example: 'Ich lerne seit einem Jahr Deutsch.' },
    { german: 'von', english: 'from / of', example: 'Das Geschenk ist von meiner Mutter.' },
    { german: 'zu', english: 'to', example: 'Ich gehe zum Arzt.' },
    { german: 'aus', english: 'from / out of', example: 'Ich komme aus Deutschland.' },
    { german: 'gegenüber', english: 'opposite', example: 'Das Café ist gegenüber dem Bahnhof.' },
  ],
  'akkusativ-prepositions': [
    { german: 'durch', english: 'through', example: 'Ich gehe durch den Park.' },
    { german: 'für', english: 'for', example: 'Das Geschenk ist für dich.' },
    { german: 'gegen', english: 'against', example: 'Er lehnt gegen die Wand.' },
    { german: 'ohne', english: 'without', example: 'Ich gehe nicht ohne dich.' },
    { german: 'um', english: 'around / at', example: 'Wir gehen um den See.' },
  ],
  'two-way-prepositions': [
    { german: 'an', english: 'on (side / wall)', example: 'Das Bild hängt an der Wand.' },
    { german: 'auf', english: 'on top of', example: 'Die Katze sitzt auf dem Tisch.' },
    { german: 'hinter', english: 'behind', example: 'Der Hund ist hinter dem Haus.' },
    { german: 'in', english: 'in / inside', example: 'Ich bin in der Küche.' },
    { german: 'neben', english: 'next to', example: 'Er sitzt neben mir.' },
    { german: 'über', english: 'above / over', example: 'Die Lampe hängt über dem Tisch.' },
    { german: 'unter', english: 'under / below', example: 'Die Katze liegt unter dem Tisch.' },
    { german: 'vor', english: 'in front of', example: 'Das Auto steht vor dem Haus.' },
    { german: 'zwischen', english: 'between', example: 'Er sitzt zwischen uns.' },
  ],
};

const HAS_IMAGE = new Set([
  'auf', 'unter', 'über', 'neben', 'vor', 'hinter', 'zwischen', 'an', 'in',
  'durch', 'um', 'gegen',
  'aus', 'zu', 'gegenüber', 'bei',
]);

export function VisualTab({ topic }: { topic: string }) {
  const prepositions = PREPOSITION_DATA[topic] ?? [];

  if (prepositions.length === 0) return null;

  return (
    <div>
      <p className="text-sm mb-5" style={{ color: 'var(--text2)' }}>
        Learn what each preposition means before practicing.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {prepositions.map(({ german, english, example }) => {
          const hasImg = HAS_IMAGE.has(german);
          return (
            <div
              key={german}
              className="rounded-xl overflow-hidden border transition-opacity hover:opacity-90"
              style={{ background: 'var(--s2)', borderColor: 'var(--line)' }}
            >
              {hasImg ? (
                <div className="h-48 flex items-center justify-center border-b" style={{ background: 'var(--s1)', borderColor: 'var(--line)' }}>
                  <img
                    src={`/prepositions/${german}.png`}
                    alt={`${german} — ${english}`}
                    className="h-full w-full object-contain p-2"
                  />
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center border-b" style={{ background: 'var(--s1)', borderColor: 'var(--line)' }}>
                  <span className="text-4xl font-bold" style={{ color: 'var(--text3)' }}>{german}</span>
                </div>
              )}
              <div className="p-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold" style={{ color: 'var(--text)' }}>{german}</span>
                  <span className="text-xs" style={{ color: 'var(--text2)' }}>{english}</span>
                </div>
                <p className="text-xs italic leading-relaxed" style={{ color: 'var(--text3)' }}>{example}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
