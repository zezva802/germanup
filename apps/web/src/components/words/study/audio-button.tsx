'use client';

import { SpeakerIcon } from '@/components/words/icons';

interface AudioButtonProps {
  text: string;
  speak: (text: string, opts?: { audioUrl?: string }) => void;
  supported: boolean;
  /** Cached cloud-TTS file; when present it plays instead of Web Speech. */
  audioUrl?: string | null;
  label?: string;
}

export function AudioButton({ text, speak, supported, audioUrl, label = 'Play audio' }: AudioButtonProps) {
  // With a cached file we can play even where Web Speech is unsupported.
  if (!supported && !audioUrl) return null;
  return (
    <button
      type="button"
      onClick={() => speak(text, audioUrl ? { audioUrl } : undefined)}
      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:opacity-80"
      style={{ background: 'var(--s2)', border: '1px solid var(--line)', color: 'var(--text2)' }}
      aria-label={label}
    >
      <SpeakerIcon width={16} height={16} /> Listen
    </button>
  );
}
