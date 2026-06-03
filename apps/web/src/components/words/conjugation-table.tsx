import type { Conjugation, ConjugationTable } from '@/types/words';

const PRONOUNS: { key: keyof ConjugationTable; label: string }[] = [
  { key: 'ich', label: 'ich' },
  { key: 'du', label: 'du' },
  { key: 'er', label: 'er/sie/es' },
  { key: 'wir', label: 'wir' },
  { key: 'ihr', label: 'ihr' },
  { key: 'sie', label: 'sie/Sie' },
];

function Tense({ title, table }: { title: string; table?: ConjugationTable }) {
  if (!table) return null;
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
        {title}
      </div>
      <div className="space-y-0.5">
        {PRONOUNS.map(({ key, label }) => (
          <div key={key} className="flex justify-between gap-3 text-sm">
            <span style={{ color: 'var(--text2)' }}>{label}</span>
            <span style={{ color: 'var(--text)' }}>{table[key] ?? '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ConjugationTableView({ conjugation }: { conjugation: Conjugation }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        <Tense title="Präsens" table={conjugation.praesens} />
        <Tense title="Präteritum" table={conjugation.imperfekt} />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: 'var(--text2)' }}>
        {conjugation.partizip2 && (
          <span>
            Partizip II: <span style={{ color: 'var(--text)' }}>{conjugation.partizip2}</span>
          </span>
        )}
        {conjugation.hilfsverb && (
          <span>
            Hilfsverb: <span style={{ color: 'var(--text)' }}>{conjugation.hilfsverb}</span>
          </span>
        )}
      </div>
    </div>
  );
}
