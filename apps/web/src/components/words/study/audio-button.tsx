'use client';

import { SpeakerIcon } from '@/components/words/icons';

interface AudioButtonProps {
  text: string;
  speak: (text: string) => void;
  supported: boolean;
  label?: string;
}

export function AudioButton({ text, speak, supported, label = 'Play audio' }: AudioButtonProps) {
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:opacity-80"
      style={{ background: 'var(--s2)', border: '1px solid var(--line)', color: 'var(--text2)' }}
      aria-label={label}
    >
      <SpeakerIcon width={16} height={16} /> Listen
    </button>
  );
}
