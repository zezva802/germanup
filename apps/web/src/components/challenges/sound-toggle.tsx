'use client';

import { useEffect, useState } from 'react';
import { isMuted, setMuted, subscribeMuted } from '@/lib/challenge-sound';

interface SoundToggleProps {
  accent: string;
  muted: string; // color name clash with audio "muted"; this is the muted-text color
  size?: number;
}

export function SoundToggle({ accent, muted: mutedColor, size = 16 }: SoundToggleProps) {
  const [isOff, setIsOff] = useState(false);

  useEffect(() => {
    setIsOff(isMuted());
    return subscribeMuted(setIsOff);
  }, []);

  function toggle() {
    setMuted(!isOff);
  }

  const color = isOff ? mutedColor : accent;

  return (
    <button
      onClick={toggle}
      aria-label={isOff ? 'Unmute sound' : 'Mute sound'}
      title={isOff ? 'Sound off' : 'Sound on'}
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', lineHeight: 0, padding: 2 }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {isOff ? (
          <path d="M23 9l-6 6M17 9l6 6" />
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M18.5 5.5a9 9 0 0 1 0 13" />
          </>
        )}
      </svg>
    </button>
  );
}
