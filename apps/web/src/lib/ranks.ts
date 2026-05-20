export const RANKS = [
  { min: 1500, name: 'Mastered', emoji: '🏆' },
  { min: 800, name: 'Confident', emoji: '🔥' },
  { min: 400, name: 'Practiced', emoji: '⚡' },
  { min: 150, name: 'Learner', emoji: '📖' },
  { min: 0, name: 'Beginner', emoji: '🌱' },
] as const;

export type RankName = (typeof RANKS)[number]['name'];

export function getRank(xp: number) {
  return RANKS.find((r) => xp >= r.min) ?? RANKS[RANKS.length - 1];
}

/** Progress (0–1) within the current rank toward the next one. */
export function getRankProgress(xp: number): number {
  const idx = RANKS.findIndex((r) => xp >= r.min);
  if (idx <= 0) return xp >= 1500 ? 1 : xp / 150;
  const current = RANKS[idx];
  const next = RANKS[idx - 1];
  return Math.min(1, (xp - current.min) / (next.min - current.min));
}

/** XP needed to reach next rank, or null if already Mastered. */
export function getNextRankXp(xp: number): number | null {
  const idx = RANKS.findIndex((r) => xp >= r.min);
  if (idx <= 0) return null;
  return RANKS[idx - 1].min;
}
