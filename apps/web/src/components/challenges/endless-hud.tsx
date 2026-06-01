import { formatTime } from '@/lib/challenge-scoring';
import type { ChallengeTheme } from '@/components/challenges/challenge-hud';

interface EndlessHudProps extends ChallengeTheme {
  lives: number;
  maxLives: number;
  score: number;
  streak: number;
  multiplier: number;
  timeMs: number;
  comboFlashKey?: number;
}

export function EndlessHud({
  accent,
  text,
  muted,
  surface,
  border,
  lives,
  maxLives,
  score,
  streak,
  multiplier,
  timeMs,
  comboFlashKey,
}: EndlessHudProps) {
  return (
    <div className="mb-6 rounded-xl p-3" style={{ background: surface, border: `1px solid ${border}` }}>
      {/* Lives + timer */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxLives }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: 99,
                display: 'inline-block',
                background: i < lives ? accent : 'transparent',
                border: `1.5px solid ${i < lives ? accent : border}`,
                boxShadow: i < lives ? `0 0 8px ${accent}66` : 'none',
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 11, letterSpacing: '0.08em', color: muted, fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(timeMs)}
        </span>
      </div>

      {/* Score + streak */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span style={{ color: text, fontSize: 26, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {score.toLocaleString()}
          </span>
          <span style={{ color: muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>pts</span>
        </div>
        <div
          key={comboFlashKey}
          className={streak >= 3 ? 'ch-combo-flash' : undefined}
          style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: streak >= 3 ? accent : muted, transformOrigin: 'right center' }}
        >
          {streak >= 1 ? `STREAK ${streak} · ×${multiplier}` : 'NO STREAK'}
        </div>
      </div>
    </div>
  );
}
