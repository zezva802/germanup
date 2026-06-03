'use client';

import { useEffect, useState } from 'react';
import { SearchIcon } from './icons';
import type { DeckSummary, Tag, PartOfSpeech } from '@/types/words';

const POS: PartOfSpeech[] = ['NOUN', 'VERB', 'ADJ', 'ADV', 'OTHER'];
const fieldStyle = { background: 'var(--s2)', border: '1px solid var(--line)', color: 'var(--text)' };

export interface WordFilterValue {
  search: string;
  deck: string;
  tag: string;
  partOfSpeech: string;
}

interface WordFiltersProps {
  value: WordFilterValue;
  onChange: (v: WordFilterValue) => void;
  decks: DeckSummary[];
  tags: Tag[];
}

export function WordFilters({ value, onChange, decks, tags }: WordFiltersProps) {
  const [search, setSearch] = useState(value.search);

  // Debounce the search text into the committed filter value.
  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== value.search) onChange({ ...value, search });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1" style={{ minWidth: 200 }}>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }}>
          <SearchIcon />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search words"
          className="w-full rounded-lg py-2 pl-9 pr-3 text-sm outline-none"
          style={fieldStyle}
        />
      </div>

      <select value={value.deck} onChange={(e) => onChange({ ...value, deck: e.target.value })} className="rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
        <option value="">All decks</option>
        {decks.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
      </select>

      <select value={value.tag} onChange={(e) => onChange({ ...value, tag: e.target.value })} className="rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
        <option value="">All tags</option>
        {tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      <select value={value.partOfSpeech} onChange={(e) => onChange({ ...value, partOfSpeech: e.target.value })} className="rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
        <option value="">All types</option>
        {POS.map((p) => <option key={p} value={p}>{p.toLowerCase()}</option>)}
      </select>
    </div>
  );
}
