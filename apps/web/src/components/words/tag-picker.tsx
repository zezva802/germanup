'use client';

import { useState } from 'react';
import { useTags, useCreateTag, useDeleteTag } from '@/hooks/use-tags';
import type { Tag } from '@/types/words';

interface TagPickerProps {
  selected: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagPicker({ selected, onChange }: TagPickerProps) {
  const { data: tags } = useTags();
  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const [draft, setDraft] = useState('');

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  };

  const removeTag = (tag: Tag) => {
    if (!confirm(`Delete tag "${tag.name}"? It will be removed from all words.`)) return;
    onChange(selected.filter((t) => t !== tag.id));
    void deleteTag.mutate(tag.id);
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
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 rounded-full pl-2.5 pr-1 py-1 text-xs"
              style={{
                background: active ? 'var(--accent-bg)' : 'var(--s3)',
                color: active ? 'var(--accent)' : 'var(--text2)',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
              }}
            >
              <button type="button" onClick={() => toggle(tag.id)} className="transition-opacity hover:opacity-80">
                {tag.name}
              </button>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Delete tag ${tag.name}`}
                title="Delete tag"
                className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full leading-none transition-opacity hover:opacity-100"
                style={{ color: 'var(--text3)', opacity: 0.7 }}
              >
                ×
              </button>
            </span>
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
