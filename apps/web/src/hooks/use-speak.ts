'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeakOptions {
  /** Future cloud-TTS seam: if a cached audio URL is provided, play it instead of synthesizing. */
  audioUrl?: string;
}

/**
 * Free German audio via the browser's Web Speech API (de-DE). No backend, no cost.
 * Gracefully no-ops when unsupported. The `audioUrl` option leaves a clean seam to
 * swap in cloud-TTS cached files later without changing call sites.
 */
export function useSpeak() {
  const [supported, setSupported] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setSupported(true);

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang === 'de-DE') ??
        voices.find((v) => v.lang.startsWith('de')) ??
        null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', pickVoice);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const speak = useCallback((text: string, opts: SpeakOptions = {}) => {
    if (!text) return;
    cancel();
    if (opts.audioUrl) {
      audioRef.current = new Audio(opts.audioUrl);
      void audioRef.current.play().catch(() => undefined);
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }, [cancel]);

  useEffect(() => () => cancel(), [cancel]);

  return { speak, cancel, supported };
}
