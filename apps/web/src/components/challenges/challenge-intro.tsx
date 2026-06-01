import Link from 'next/link';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';
import { badgeLabel, type Badge } from '@/lib/challenge-scoring';
import type { ChallengeTheme } from '@/components/challenges/challenge-hud';

interface ChallengeIntroProps extends ChallengeTheme {
  slug: string;
  kicker: string; // e.g. "Case File", "Incoming transmission"
  title: string;
  tagline: string;
  rules: string[]; // short bullet lines
  bestBadge?: Badge | null;
  bestScore?: number | null;
  beginLabel: string;
  onBegin: () => void;
  titleFontFamily?: string;
}

export function ChallengeIntro({
  accent,
  text,
  muted,
  surface,
  border,
  slug,
  kicker,
  title,
  tagline,
  rules,
  bestBadge,
  bestScore,
  beginLabel,
  onBegin,
  titleFontFamily,
}: ChallengeIntroProps) {
  const hasBest = bestScore != null && bestScore > 0;

  return (
    <div className="flex flex-col items-center text-center" style={{ minHeight: 320 }}>
      <div
        className="rounded-2xl flex items-center justify-center mb-5"
        style={{ width: 64, height: 64, background: surface, border: `1px solid ${border}`, color: accent }}
      >
        <ChallengeIcon slug={slug} size={30} color={accent} />
      </div>

      <p style={{ fontSize: 11, letterSpacing: '0.25em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
        {kicker}
      </p>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: text, lineHeight: 1.1, marginBottom: 10, fontFamily: titleFontFamily, letterSpacing: titleFontFamily ? '0.01em' : undefined }}>{title}</h1>
      <p style={{ fontSize: 15, color: muted, maxWidth: 460, lineHeight: 1.55, marginBottom: 22 }}>{tagline}</p>

      {/* Rules */}
      <div
        className="rounded-xl mb-6 text-left"
        style={{ background: surface, border: `1px solid ${border}`, padding: '14px 18px', maxWidth: 440, width: '100%' }}
      >
        {rules.map((r, i) => (
          <div key={i} className="flex items-start gap-2.5" style={{ padding: '4px 0' }}>
            <span style={{ color: accent, fontSize: 13, fontWeight: 800, lineHeight: 1.5 }}>{String(i + 1).padStart(2, '0')}</span>
            <span style={{ color: text, fontSize: 13.5, lineHeight: 1.5 }}>{r}</span>
          </div>
        ))}
      </div>

      {hasBest && (
        <p style={{ fontSize: 13, color: muted, marginBottom: 18 }}>
          High score: <span style={{ color: accent, fontWeight: 700 }}>{bestScore!.toLocaleString()}</span>
          {bestBadge ? ` · ${badgeLabel(bestBadge)}` : ''}
        </p>
      )}

      <button
        onClick={onBegin}
        style={{
          padding: '12px 32px',
          borderRadius: 12,
          fontWeight: 800,
          fontSize: 15,
          letterSpacing: '0.03em',
          background: accent,
          color: '#111',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {beginLabel}
      </button>

      <Link
        href="/grammar/challenges"
        style={{ marginTop: 16, fontSize: 13, color: muted, textDecoration: 'none' }}
      >
        ← Back to Challenges
      </Link>
    </div>
  );
}
