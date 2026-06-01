'use client';

import Link from 'next/link';
import { CHALLENGES } from '@germanup/types';
import { useChallengeResults, type Badge } from '@/hooks/use-challenges';
import { useSubscriptionStatus } from '@/hooks/use-subscription';
import { ChallengeIcon } from '@/components/challenges/challenge-icon';

// Per-challenge theming — each card previews its challenge's world.
const THEME: Record<string, { bg: string; accent: string; text: string; mechanic: string; motif: string }> = {
  'the-detective': { bg: '#0a0806', accent: '#d4922a', text: '#f0e8d8', mechanic: 'Spot the error', motif: 'blinds' },
  'the-cipher':    { bg: '#050f08', accent: '#22c55e', text: '#d4f0dc', mechanic: 'Sort & classify', motif: 'scanlines' },
  'the-forger':    { bg: '#0d0b09', accent: '#c8a84b', text: '#ede8de', mechanic: 'Forge the word', motif: 'paper' },
  'the-decoder':   { bg: '#080a12', accent: '#60a5fa', text: '#c8d8f0', mechanic: 'Rebuild the signal', motif: 'wave' },
  'the-echo':      { bg: '#0a0a0f', accent: '#a78bfa', text: '#e8e8f0', mechanic: 'Flash memory', motif: 'radar' },
};

const BADGE_STYLE: Record<Badge, { label: string; color: string }> = {
  bronze: { label: 'Bronze', color: '#c08457' },
  silver: { label: 'Silver', color: '#cbd3da' },
  gold: { label: 'Gold', color: '#e6b53c' },
  diamond: { label: 'Diamond', color: '#76d4ea' },
};

function Motif({ motif, accent }: { motif: string; accent: string }) {
  const base: React.CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };
  switch (motif) {
    case 'blinds':
      return <div aria-hidden className="noir-blinds" style={{ ...base, opacity: 0.6 }} />;
    case 'scanlines':
      return <div aria-hidden className="crt-scanlines" style={{ ...base, opacity: 0.5 }} />;
    case 'paper':
      return <div aria-hidden style={{ ...base, backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 17px, rgba(237,232,222,0.05) 17px, rgba(237,232,222,0.05) 18px)' }} />;
    case 'wave':
      return <div aria-hidden className="signal-wave" style={{ ...base, opacity: 0.16 }} />;
    case 'radar':
      return <div aria-hidden style={{ ...base, background: `conic-gradient(from 200deg at 82% 22%, ${accent}22, transparent 70deg)` }} />;
    default:
      return null;
  }
}

function LockIcon({ size = 12, color = '#111' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function ChallengesPage() {
  const { data: results } = useChallengeResults();
  const { data: subscription } = useSubscriptionStatus();
  const isPro = subscription?.plan === 'PRO';

  const resultMap = new Map((results ?? []).map((r) => [r.challengeSlug, r]));
  const badgesEarned = (results ?? []).filter((r) => r.badge).length;

  return (
    <div style={{ maxWidth: 740 }}>
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            Challenges
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
            Five endless worlds. Survive the run, chase the high score.
          </p>
        </div>
        {(isPro || badgesEarned > 0) && (
          <div
            className="shrink-0 text-center rounded-xl px-4 py-2"
            style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
          >
            <div className="text-xl font-black" style={{ color: 'var(--accent)' }}>{badgesEarned}<span style={{ color: 'var(--text3)', fontSize: 14, fontWeight: 700 }}>/5</span></div>
            <div className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text3)' }}>Badges</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CHALLENGES.map((c) => {
          const theme = THEME[c.slug] ?? { bg: '#0d0d12', accent: 'var(--accent)', text: '#fff', mechanic: '', motif: '' };
          const result = resultMap.get(c.slug);
          const badge = result?.badge ?? null;
          const badgeStyle = badge ? BADGE_STYLE[badge] : null;
          const playsCount = result?.playsCount ?? 0;
          const bestScore = result?.bestScore ?? null;

          const card = (
            <div
              className="relative rounded-2xl overflow-hidden group transition-all duration-200"
              style={{
                height: 208,
                background: theme.bg,
                border: '1px solid var(--line)',
              }}
            >
              <Motif motif={theme.motif} accent={theme.accent} />

              {/* Accent glow */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full transition-opacity duration-300"
                style={{ background: theme.accent, opacity: 0.16, filter: 'blur(40px)' }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-5">
                <div className="flex items-start justify-between mb-auto">
                  <div
                    className="rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{ width: 46, height: 46, background: 'rgba(255,255,255,0.06)', color: theme.accent, boxShadow: `0 0 24px ${theme.accent}22` }}
                  >
                    <ChallengeIcon slug={c.slug} size={23} />
                  </div>
                  {theme.mechanic && (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide"
                      style={{ background: 'rgba(255,255,255,0.08)', color: theme.text, opacity: 0.7 }}
                    >
                      {theme.mechanic}
                    </span>
                  )}
                </div>

                <div>
                  <h2 className="font-bold text-lg leading-tight mb-0.5" style={{ color: theme.text }}>
                    {c.name}
                  </h2>
                  <p className="text-sm mb-3" style={{ color: theme.text, opacity: 0.58 }}>
                    {c.description}
                  </p>

                  <div className="flex items-center gap-2.5" style={{ minHeight: 22 }}>
                    {badgeStyle && (
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ background: 'rgba(0,0,0,0.5)', color: badgeStyle.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, border: `1px solid ${badgeStyle.color}55` }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 99, background: badgeStyle.color, display: 'inline-block' }} />
                        {badgeStyle.label}
                      </span>
                    )}
                    {playsCount > 0 && bestScore !== null && (
                      <span className="text-xs" style={{ color: theme.text, opacity: 0.55 }}>
                        High {bestScore.toLocaleString()}
                      </span>
                    )}
                    {isPro && playsCount === 0 && (
                      <span className="text-xs font-bold" style={{ color: theme.accent }}>Play →</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pro lock overlay */}
              {!isPro && (
                <>
                  <div className="absolute inset-0 z-20" style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(1px)' }} />
                  <span
                    className="absolute top-3 right-3 z-30 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--accent)', color: '#111' }}
                  >
                    <LockIcon size={11} /> PRO
                  </span>
                </>
              )}
            </div>
          );

          return isPro ? (
            <Link
              key={c.slug}
              href={`/grammar/challenge/${c.slug}`}
              className="block cursor-pointer transition-transform duration-200 hover:-translate-y-1"
              style={{ textDecoration: 'none' }}
            >
              {card}
            </Link>
          ) : (
            <div key={c.slug} style={{ pointerEvents: 'none' }}>
              {card}
            </div>
          );
        })}
      </div>

      {!isPro && (
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 mt-4 rounded-xl py-3 transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#111', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}
        >
          <LockIcon size={14} /> Unlock all 5 challenges with Pro
        </Link>
      )}
    </div>
  );
}
