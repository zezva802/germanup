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

// Accuracy-dominant per-answer points (out of 100): being correct is worth most,
// speed and an active streak add a smaller bonus. Keeps scores intuitive — e.g.
// 9/10 correct lands high regardless of pace, and a perfect fast run hits 1000.
export function answerScore(
  correct: boolean,
  timeMs: number,
  fastMs: number,
  midMs: number,
  slowMs: number,
  streakBefore: number,
  partial = false,
): number {
  if (!correct) return partial ? 35 : 0;
  const speed = timeMs < fastMs ? 18 : timeMs < midMs ? 12 : timeMs < slowMs ? 7 : 3;
  const combo = Math.min(12, streakBefore * 3);
  return Math.min(100, 70 + speed + combo);
}

// Sum of per-answer points (each ≤100) → 0–1000 over n questions.
export function finalFromAnswers(sum: number, n: number): number {
  if (n <= 0) return 0;
  return Math.max(0, Math.min(1000, Math.round((sum / (n * 100)) * 1000)));
}

// ─── Endless mode: uncapped cumulative high score ──────────────────────────────
// Streak multiplier compounds and is the engine of a high score (no 1000 cap),
// rising every 3 in a row up to ×5.
export function endlessMultiplier(streak: number): number {
  return Math.min(5, 1 + Math.floor(streak / 3) * 0.5);
}

// Speed-tiered base points for an endless answer (before the streak multiplier).
export function endlessSpeedBase(timeMs: number, fastMs: number, midMs: number, slowMs: number): number {
  if (timeMs < fastMs) return 50;
  if (timeMs < midMs) return 35;
  if (timeMs < slowMs) return 22;
  return 12;
}

// Badges become high-score milestones (mirrors the API's calculateBadge).
export const BADGE_MILESTONES: { badge: Badge; score: number }[] = [
  { badge: 'diamond', score: 8000 },
  { badge: 'gold', score: 5000 },
  { badge: 'silver', score: 2500 },
  { badge: 'bronze', score: 1000 },
];
export function milestoneBadge(score: number): Badge | null {
  for (const m of BADGE_MILESTONES) if (score >= m.score) return m.badge;
  return null;
}
// Points to the next milestone (or null at the top).
export function nextMilestone(score: number): { badge: Badge; score: number } | null {
  const ordered = [...BADGE_MILESTONES].reverse(); // bronze→diamond
  for (const m of ordered) if (score < m.score) return m;
  return null;
}
