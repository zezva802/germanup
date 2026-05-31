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
