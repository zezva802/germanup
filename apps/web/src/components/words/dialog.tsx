'use client';

import { type ReactNode, useEffect } from 'react';
import { CloseIcon } from './icons';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Calm dark modal local to the Words feature (the shared ui/modal is light-themed). */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--s2)', border: '1px solid var(--line)', color: 'var(--text)' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 transition-colors hover:opacity-70"
            style={{ color: 'var(--text2)' }}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
