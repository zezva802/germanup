// Shared scoring/badge helpers for the challenge suite (DOG-89 thresholds).
// Score is always out of 1000.

export type Badge = 'bronze' | 'silver' | 'gold' | 'diamond';

export function badgeFor(score: number): Badge | null {
  if (score >= 920) return 'diamond';
  if (score >= 800) return 'gold';
  if (score >= 650) return 'silver';
  if (score >= 500) return 'bronze';
  return null;
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function badgeLabel(badge: Badge | null): string {
  return badge ? cap(badge) : 'No badge';
}

export function formatTime(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── Combo / streak scoring ────────────────────────────────────────────────────
// Consecutive correct answers raise a points multiplier. The raw combo total is
// normalized back onto the 0–1000 scale at the end (see normalizeScore), so the
// saved score and badge thresholds stay meaningful.

export function comboMultiplier(streak: number): number {
  if (streak >= 6) return 3;
  if (streak >= 4) return 2;
  if (streak >= 2) return 1.5;
  return 1;
}

// Best possible raw total over n questions: all correct, fastest, with the combo
// schedule applied. Used as the denominator when normalizing to 1000.
export function perfectComboRaw(n: number, perBase = 100): number {
  let raw = 0;
  for (let s = 0; s < n; s++) raw += perBase * comboMultiplier(s);
  return raw;
}

export function normalizeScore(raw: number, perfect: number): number {
  if (perfect <= 0) return 0;
  return Math.max(0, Math.min(1000, Math.round((raw / perfect) * 1000)));
}
