import { formatTime } from '@/lib/challenge-scoring';

export interface ChallengeTheme {
  accent: string;
  text: string;
  muted: string;
  surface: string;
  border: string;
}

interface ChallengeHudProps extends ChallengeTheme {
  unit: string; // "Case", "Document", "Transmission", "Echo", "Run"
  index: number; // 0-based current
  total: number;
  points: number;
  streak: number;
  multiplier: number;
  timeMs: number;
  recentGain?: number | null; // transient "+N" after a correct answer
  comboFlashKey?: number; // bump to replay the streak flash when the multiplier rises
}

export function ChallengeHud({
  accent,
  text,
  muted,
  surface,
  border,
  unit,
  index,
  total,
  points,
  streak,
  multiplier,
  timeMs,
  recentGain,
  comboFlashKey,
}: ChallengeHudProps) {
  const pct = total > 0 ? Math.min(100, ((index + 1) / total) * 100) : 0;

  return (
    <div
      className="mb-6 rounded-xl p-3"
      style={{ background: surface, border: `1px solid ${border}` }}
    >
      {/* Top row: counter + timer */}
      <div className="flex items-center justify-between mb-2" style={{ fontSize: 11, letterSpacing: '0.08em' }}>
        <span style={{ color: muted, textTransform: 'uppercase' }}>
          {unit} {Math.min(index + 1, total)} / {total}
        </span>
        <span style={{ color: muted, fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeMs)}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: border }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: accent }} />
      </div>

      {/* Points + streak */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span style={{ color: text, fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {points.toLocaleString()}
          </span>
          <span style={{ color: muted, fontSize: 11, letterSpacing: '0.04em' }}>/ 1000</span>
          {recentGain != null && recentGain > 0 && (
            <span style={{ color: accent, fontSize: 12, fontWeight: 700 }}>+{recentGain.toLocaleString()}</span>
          )}
        </div>

        <div
          key={comboFlashKey}
          className={streak >= 2 ? 'ch-combo-flash' : undefined}
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            color: streak >= 2 ? accent : muted,
            transition: 'color 0.2s',
            transformOrigin: 'right center',
          }}
        >
          {streak >= 2 ? `STREAK ${streak} · ×${multiplier}` : streak === 1 ? 'STREAK 1' : 'NO STREAK'}
        </div>
      </div>
    </div>
  );
}
