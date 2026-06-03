'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from './dialog';
import { useCreateDeck } from '@/hooks/use-decks';

const fieldStyle = { background: 'var(--s3)', border: '1px solid var(--line)', color: 'var(--text)' };

export function CreateDeckModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createDeck = useCreateDeck();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!title.trim()) { setError('Title is required.'); return; }
    try {
      await createDeck.mutateAsync({ title: title.trim(), description: description.trim() || undefined });
      setTitle('');
      setDescription('');
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="New deck">
      <div className="space-y-3">
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Title</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} autoFocus />
        </div>
        <div>
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Description (optional)</div>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} />
        </div>
        {error && <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" loading={createDeck.isPending} onClick={submit} type="button">Create</Button>
        </div>
      </div>
    </Dialog>
  );
}
