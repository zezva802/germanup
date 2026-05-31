// Synthesized challenge sound effects via the Web Audio API.
// No asset files — short, soft tones generated on the fly. All calls no-op when
// muted or when no AudioContext is available (SSR / unsupported).

export type SoundName = 'click' | 'correct' | 'wrong' | 'combo' | 'finish';

const STORAGE_KEY = 'gu_challenge_muted';

let ctx: AudioContext | null = null;
let muted = false;
const listeners = new Set<(muted: boolean) => void>();

// Read persisted mute state lazily (client only).
function loadMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let loaded = false;
function ensureLoaded() {
  if (!loaded) {
    muted = loadMuted();
    loaded = true;
  }
}

export function isMuted(): boolean {
  ensureLoaded();
  return muted;
}

export function setMuted(value: boolean) {
  ensureLoaded();
  muted = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(muted));
}

export function subscribeMuted(listener: (muted: boolean) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

// Must be called from a user gesture (e.g. the "Begin" button) so the browser
// allows audio to start.
export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

// One soft tone with a fast attack/decay envelope.
function tone(
  c: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  peak = 0.12,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export function playSound(name: SoundName) {
  ensureLoaded();
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime;

  switch (name) {
    case 'click':
      tone(c, 320, t, 0.06, 'triangle', 0.07);
      break;
    case 'correct':
      // soft two-note rise
      tone(c, 523.25, t, 0.12, 'sine', 0.1); // C5
      tone(c, 659.25, t + 0.08, 0.16, 'sine', 0.1); // E5
      break;
    case 'wrong':
      // low muted thud
      tone(c, 150, t, 0.18, 'sine', 0.12);
      tone(c, 110, t + 0.04, 0.2, 'sine', 0.09);
      break;
    case 'combo':
      // quick upward blip
      tone(c, 660, t, 0.07, 'triangle', 0.09);
      tone(c, 990, t + 0.06, 0.1, 'triangle', 0.09);
      break;
    case 'finish':
      // gentle major chord
      tone(c, 523.25, t, 0.5, 'sine', 0.09); // C5
      tone(c, 659.25, t, 0.5, 'sine', 0.08); // E5
      tone(c, 783.99, t, 0.55, 'sine', 0.08); // G5
      break;
  }
}
