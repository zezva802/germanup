import Link from 'next/link';
import { useCountUp } from '@/hooks/use-count-up';
import { badgeLabel, milestoneBadge } from '@/lib/challenge-scoring';
import type { ChallengeTheme } from '@/components/challenges/challenge-hud';

interface Stat {
  label: string;
  value: string | number;
}

interface EndlessResultsProps extends ChallengeTheme {
  active: boolean; // run the count-up while the results are showing
  score: number;
  prevBest: number;
  rating: string;
  kicker?: string;
  stats: Stat[];
  playAgainLabel: string;
  onPlayAgain: () => void;
}

export function EndlessResults({
  accent,
  text,
  muted,
  surface,
  border,
  active,
  score,
  prevBest,
  rating,
  kicker,
  stats,
  playAgainLabel,
  onPlayAgain,
}: EndlessResultsProps) {
  const shown = useCountUp(active ? score : 0);
  const badge = milestoneBadge(score);
  const isNewBest = score > prevBest;
  const accentBg = `${accent}26`; // ~15% alpha
  const accentBorder = `${accent}66`;

  return (
    <div className="text-center py-4">
      {kicker && (
        <p style={{ fontSize: 11, fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.25em', textTransform: 'uppercase', color: muted, marginBottom: 10 }}>
          {kicker}
        </p>
      )}
      <p style={{ fontSize: 13, letterSpacing: '0.15em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
        {rating}
      </p>
      <h2 style={{ fontSize: 46, fontWeight: 800, color: text, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {shown.toLocaleString()}
      </h2>
      <p style={{ fontSize: 12, color: muted, marginTop: 2, letterSpacing: '0.08em' }}>POINTS</p>

      <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 mt-4 mb-2">
        <span
          className="ch-stamp-in"
          style={{ display: 'inline-block', background: badge ? accentBg : surface, color: badge ? accent : muted, border: `1px solid ${badge ? accentBorder : border}`, fontSize: 13, fontWeight: 700, padding: '5px 14px', borderRadius: 99 }}
        >
          {badgeLabel(badge)}
        </span>
        {stats.map((s) => (
          <span key={s.label} style={{ fontSize: 13, color: muted }}>
            {s.label} {s.value}
          </span>
        ))}
      </div>

      {isNewBest ? (
        <p style={{ fontSize: 14, fontWeight: 700, color: accent, marginTop: 8 }}>New high score!</p>
      ) : (
        <p style={{ fontSize: 13, color: muted, marginTop: 8 }}>High score: {prevBest.toLocaleString()}</p>
      )}

      <div className="flex gap-3 justify-center mt-8">
        <Link
          href="/grammar/challenges"
          style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, background: surface, color: muted, border: `1px solid ${border}`, textDecoration: 'none' }}
        >
          Back to Challenges
        </Link>
        <button
          onClick={onPlayAgain}
          style={{ padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, background: accent, color: '#111', border: 'none', cursor: 'pointer' }}
        >
          {playAgainLabel}
        </button>
      </div>
    </div>
  );
}
