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

export type SoundPack = 'default' | 'cipher' | 'forger' | 'decoder' | 'echo';

// Short filtered noise burst — used for clacks, static, etc.
function noise(c: AudioContext, start: number, duration: number, peak: number, filterHz: number, type: BiquadFilterType = 'bandpass') {
  const frames = Math.floor(c.sampleRate * duration);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = filterHz;
  const gain = c.createGain();
  gain.gain.setValueAtTime(peak, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start(start);
  src.stop(start + duration + 0.02);
}

export function playSound(name: SoundName, pack: SoundPack = 'default') {
  ensureLoaded();
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime;

  // ── Cipher: clipped digital/terminal blips (square + sawtooth) ──
  if (pack === 'cipher') {
    switch (name) {
      case 'click':
        tone(c, 900, t, 0.03, 'square', 0.05);
        break;
      case 'correct':
        tone(c, 740, t, 0.05, 'square', 0.06);
        tone(c, 1110, t + 0.05, 0.07, 'square', 0.06);
        break;
      case 'wrong':
        tone(c, 200, t, 0.16, 'sawtooth', 0.08);
        tone(c, 150, t + 0.05, 0.16, 'sawtooth', 0.07);
        break;
      case 'combo':
        tone(c, 700, t, 0.04, 'square', 0.06);
        tone(c, 950, t + 0.04, 0.04, 'square', 0.06);
        tone(c, 1300, t + 0.08, 0.06, 'square', 0.06);
        break;
      case 'finish':
        [523, 659, 880, 1175].forEach((f, i) => tone(c, f, t + i * 0.09, 0.12, 'square', 0.06));
        break;
    }
    return;
  }

  // ── Forger: mechanical typewriter ──
  if (pack === 'forger') {
    switch (name) {
      case 'click': // key clack
        noise(c, t, 0.025, 0.1, 2600, 'highpass');
        tone(c, 200, t, 0.035, 'square', 0.05);
        break;
      case 'correct': // carriage bell
        tone(c, 1568, t, 0.32, 'sine', 0.09);
        tone(c, 2093, t, 0.26, 'sine', 0.05);
        break;
      case 'wrong': // dull thunk
        tone(c, 130, t, 0.16, 'square', 0.09);
        noise(c, t, 0.09, 0.05, 700, 'lowpass');
        break;
      case 'combo':
        tone(c, 1568, t, 0.12, 'sine', 0.07);
        tone(c, 2093, t + 0.1, 0.14, 'sine', 0.07);
        break;
      case 'finish':
        [1319, 1568, 2093].forEach((f, i) => tone(c, f, t + i * 0.1, 0.16, 'sine', 0.07));
        break;
    }
    return;
  }

  // ── Decoder: modem / static / signal-lock ──
  if (pack === 'decoder') {
    switch (name) {
      case 'click':
        tone(c, 1400, t, 0.02, 'square', 0.04);
        break;
      case 'correct': // lock-on
        tone(c, 600, t, 0.08, 'sawtooth', 0.06);
        tone(c, 1200, t + 0.06, 0.13, 'sawtooth', 0.06);
        break;
      case 'wrong': // static burst
        noise(c, t, 0.2, 0.09, 1200, 'bandpass');
        break;
      case 'combo':
        [800, 1200, 1600].forEach((f, i) => tone(c, f, t + i * 0.05, 0.05, 'sawtooth', 0.06));
        break;
      case 'finish':
        [523, 784, 1047, 1568].forEach((f, i) => tone(c, f, t + i * 0.08, 0.12, 'sawtooth', 0.06));
        break;
    }
    return;
  }

  // ── Echo: sonar / radar pings ──
  if (pack === 'echo') {
    switch (name) {
      case 'click':
        tone(c, 1000, t, 0.03, 'sine', 0.04);
        break;
      case 'correct': // sonar ping
        tone(c, 1320, t, 0.45, 'sine', 0.1);
        break;
      case 'wrong': // low sub
        tone(c, 90, t, 0.3, 'sine', 0.1);
        break;
      case 'combo':
        tone(c, 1320, t, 0.2, 'sine', 0.07);
        tone(c, 1760, t + 0.12, 0.26, 'sine', 0.07);
        break;
      case 'finish':
        [880, 1320, 1760].forEach((f, i) => tone(c, f, t + i * 0.12, 0.4, 'sine', 0.07));
        break;
    }
    return;
  }

  // ── Default pack (soft sine tones) ──
  switch (name) {
    case 'click':
      tone(c, 320, t, 0.06, 'triangle', 0.07);
      break;
    case 'correct':
      tone(c, 523.25, t, 0.12, 'sine', 0.1);
      tone(c, 659.25, t + 0.08, 0.16, 'sine', 0.1);
      break;
    case 'wrong':
      tone(c, 150, t, 0.18, 'sine', 0.12);
      tone(c, 110, t + 0.04, 0.2, 'sine', 0.09);
      break;
    case 'combo':
      tone(c, 660, t, 0.07, 'triangle', 0.09);
      tone(c, 990, t + 0.06, 0.1, 'triangle', 0.09);
      break;
    case 'finish':
      tone(c, 523.25, t, 0.5, 'sine', 0.09);
      tone(c, 659.25, t, 0.5, 'sine', 0.08);
      tone(c, 783.99, t, 0.55, 'sine', 0.08);
      break;
  }
}
