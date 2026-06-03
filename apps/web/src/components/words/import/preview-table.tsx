'use client';

import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { PreviewRow, PartOfSpeech } from '@/types/words';

export type EditableRow = PreviewRow & { selected: boolean; override?: boolean };

const POS: PartOfSpeech[] = ['NOUN', 'VERB', 'ADJ', 'ADV', 'OTHER'];
const GENDERS = ['', 'der', 'die', 'das'];

const cell = { background: 'var(--s3)', border: '1px solid var(--line)', color: 'var(--text)' };
const aiCell = { ...cell, borderBottom: '2px solid var(--accent)' };

interface PreviewTableProps {
  rows: EditableRow[];
  onChange: (rows: EditableRow[]) => void;
}

export function PreviewTable({ rows, onChange }: PreviewTableProps) {
  const update = (i: number, patch: Partial<EditableRow>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const selectedCount = rows.filter((r) => r.selected).length;
  const allSelected = selectedCount === rows.length && rows.length > 0;

  const toggleAll = () => onChange(rows.map((r) => ({ ...r, selected: !allSelected })));
  const bulkSet = (patch: Partial<EditableRow>) =>
    onChange(rows.map((r) => (r.selected ? { ...r, ...patch } : r)));

  const fieldStyle = (row: EditableRow, field: string): CSSProperties =>
    row.fieldsFilledByAI.includes(field) ? aiCell : cell;

  const inputCls = 'w-full rounded-md px-2 py-1 text-sm outline-none';

  return (
    <div>
      {/* Bulk-edit toolbar */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--text2)' }}>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          {selectedCount} of {rows.length} selected
        </label>
        <span style={{ color: 'var(--text3)' }}>|</span>
        <span>Set type for selected:</span>
        <select className="rounded-md px-2 py-1" style={cell} defaultValue="" onChange={(e) => { if (e.target.value) bulkSet({ partOfSpeech: e.target.value as PartOfSpeech }); e.target.value = ''; }}>
          <option value="" disabled>type…</option>
          {POS.map((p) => <option key={p} value={p}>{p.toLowerCase()}</option>)}
        </select>
        <span>level:</span>
        <select className="rounded-md px-2 py-1" style={cell} defaultValue="" onChange={(e) => { if (e.target.value) bulkSet({ level: e.target.value }); e.target.value = ''; }}>
          <option value="" disabled>level…</option>
          {['A1', 'A2', 'A3'].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--line)' }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ color: 'var(--text3)' }} className="text-left text-[10px] uppercase tracking-widest">
              <th className="p-2"></th>
              <th className="p-2">German</th>
              <th className="p-2">Gender</th>
              <th className="p-2">English</th>
              <th className="p-2">Plural</th>
              <th className="p-2">Example</th>
              <th className="p-2">Type</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const dim = row.status === 'duplicate' && !row.override;
              return (
                <tr key={i} style={{ borderTop: '1px solid var(--line)', opacity: row.selected ? 1 : 0.45 }}>
                  <td className="p-2 align-top">
                    <input type="checkbox" checked={row.selected} onChange={(e) => update(i, { selected: e.target.checked })} />
                  </td>
                  <td className="p-2"><input className={inputCls} style={cell} value={row.german} onChange={(e) => update(i, { german: e.target.value })} /></td>
                  <td className="p-2">
                    <select className={cn(inputCls)} style={cell} value={row.gender ?? ''} onChange={(e) => update(i, { gender: e.target.value || null })}>
                      {GENDERS.map((g) => <option key={g} value={g}>{g || '—'}</option>)}
                    </select>
                  </td>
                  <td className="p-2"><input className={inputCls} style={fieldStyle(row, 'english')} value={row.english} onChange={(e) => update(i, { english: e.target.value })} /></td>
                  <td className="p-2"><input className={inputCls} style={cell} value={row.plural ?? ''} onChange={(e) => update(i, { plural: e.target.value || null })} /></td>
                  <td className="p-2" style={{ minWidth: 180 }}><input className={inputCls} style={fieldStyle(row, 'example')} value={row.example ?? ''} onChange={(e) => update(i, { example: e.target.value || null })} /></td>
                  <td className="p-2">
                    <select className={inputCls} style={fieldStyle(row, 'level')} value={row.partOfSpeech} onChange={(e) => update(i, { partOfSpeech: e.target.value as PartOfSpeech })}>
                      {POS.map((p) => <option key={p} value={p}>{p.toLowerCase()}</option>)}
                    </select>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[10px]"
                        style={{ background: dim ? 'rgba(251,178,36,0.12)' : 'var(--s3)', color: row.status === 'duplicate' ? 'var(--amber)' : 'var(--text2)', border: '1px solid var(--line)' }}>
                        {row.status}
                      </span>
                      {row.fieldsFilledByAI.length > 0 && (
                        <span className="inline-flex w-fit rounded-full px-2 py-0.5 text-[10px]" style={{ color: 'var(--accent)', border: '1px solid var(--accent)' }} title={`AI filled: ${row.fieldsFilledByAI.join(', ')}`}>
                          AI
                        </span>
                      )}
                      {row.status === 'duplicate' && (
                        <label className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text3)' }}>
                          <input type="checkbox" checked={!!row.override} onChange={(e) => update(i, { override: e.target.checked })} />
                          import anyway
                        </label>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
