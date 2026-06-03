'use client';

import { useState } from 'react';
import { useTags, useCreateTag } from '@/hooks/use-tags';
import { cn } from '@/lib/utils';

interface TagPickerProps {
  selected: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ selected, onChange }: TagPickerProps) {
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const [draft, setDraft] = useState('');

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  };

  const addNew = async () => {
    const name = draft.trim();
    if (!name) return;
    const existing = tags?.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (!selected.includes(existing.id)) onChange([...selected, existing.id]);
    } else {
      const created = await createTag.mutateAsync(name);
      onChange([...selected, created.id]);
    }
    setDraft('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {(tags ?? []).map((tag) => {
          const active = selected.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              className={cn('rounded-full px-2.5 py-1 text-xs transition-colors')}
              style={{
                background: active ? 'var(--accent-bg)' : 'var(--s3)',
                color: active ? 'var(--accent)' : 'var(--text2)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
              }}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void addNew();
          }
        }}
        placeholder="Add a tag and press Enter"
        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
        style={{ background: 'var(--s3)', border: '1px solid var(--line)', color: 'var(--text)' }}
      />
    </div>
  );
}
