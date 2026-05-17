'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useImportWords } from '@/hooks/use-vocab';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [text, setText] = useState('');
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const { mutate, isPending, error } = useImportWords();

  const handleImport = () => {
    const words = text
      .split('\n')
      .map((w) => w.trim())
      .filter(Boolean)
      .slice(0, 20);

    if (!words.length) return;

    mutate(words, {
      onSuccess: (data) => {
        setSuccessCount(data.length);
        setText('');
        setTimeout(() => {
          setSuccessCount(null);
          onClose();
        }, 1500);
      },
    });
  };

  const wordCount = text
    .split('\n')
    .map((w) => w.trim())
    .filter(Boolean).length;

  return (
    <Modal open={open} onClose={onClose} title="Import vocabulary">
      <p className="text-sm text-gray-600 mb-3">
        Enter German words, one per line (max 20). Claude will add gender, plural, example sentence and translation.
      </p>

      <textarea
        className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        placeholder={'Hund\nKatze\nAuto\nHaus'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex items-center justify-between mt-1 mb-4">
        <span className="text-xs text-gray-400">{wordCount}/20 words</span>
        {wordCount > 20 && (
          <span className="text-xs text-red-500">Only first 20 will be imported</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-3">{(error as Error).message}</p>
      )}

      {successCount !== null && (
        <p className="text-sm text-green-600 mb-3">
          ✓ Imported {successCount} words successfully!
        </p>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleImport} loading={isPending} disabled={!wordCount}>
          {isPending ? 'Importing with AI…' : 'Import'}
        </Button>
      </div>
    </Modal>
  );
}
