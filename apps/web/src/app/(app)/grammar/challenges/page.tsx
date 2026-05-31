'use client';

import Link from 'next/link';
import { CHALLENGES } from '@germanup/types';
import { useChallengeResults, type Badge } from '@/hooks/use-challenges';
import { useSubscriptionStatus } from '@/hooks/use-subscription';

// Per-challenge theming. No art assets exist for the new challenge slugs yet,
// so each card is themed with its bespoke page's color scheme + emoji instead.
const THEME: Record<string, { bg: string; accent: string; text: string; mechanic: string }> = {
  'the-detective': { bg: '#0a0806', accent: '#d4922a', text: '#f0e8d8', mechanic: 'Spot the error · timed' },
  'the-cipher':    { bg: '#050f08', accent: '#22c55e', text: '#d4f0dc', mechanic: 'Sort & classify' },
  'the-forger':    { bg: '#0d0b09', accent: '#c8a84b', text: '#ede8de', mechanic: 'Fill the blank' },
  'the-decoder':   { bg: '#080a12', accent: '#60a5fa', text: '#c8d8f0', mechanic: 'Rebuild the sentence' },
  'the-echo':      { bg: '#0a0a0f', accent: '#a78bfa', text: '#e8e8f0', mechanic: 'Flash memory' },
};

const BADGE_LABEL: Record<Badge, string> = {
  bronze: '🥉 Bronze',
  silver: '🥈 Silver',
  gold: '🥇 Gold',
  diamond: '💎 Diamond',
};

export default function ChallengesPage() {
  const { data: results } = useChallengeResults();
  const { data: subscription } = useSubscriptionStatus();
  const isPro = subscription?.plan === 'PRO';

  const resultMap = new Map((results ?? []).map((r) => [r.challengeSlug, r]));

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
          Challenges
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
          Five modes. Each tests a different way of thinking in German.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CHALLENGES.map((c) => {
          const theme = THEME[c.slug] ?? { bg: '#0d0d12', accent: 'var(--accent)', text: '#fff', mechanic: '' };
          const result = resultMap.get(c.slug);
          const badge = result?.badge ?? null;
          const playsCount = result?.playsCount ?? 0;
          const bestScore = result?.bestScore ?? null;

          const card = (
            <div
              className="relative rounded-2xl overflow-hidden group transition-transform"
              style={{
                height: 200,
                background: theme.bg,
                border: '1px solid var(--line)',
              }}
            >
              {/* Accent glow */}
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full transition-opacity group-hover:opacity-100"
                style={{ background: theme.accent, opacity: 0.18, filter: 'blur(40px)' }}
              />

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full p-5">
                {/* Top row: emoji + mechanic tag */}
                <div className="flex items-start justify-between mb-auto">
                  <div
                    className="rounded-xl flex items-center justify-center"
                    style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.06)', fontSize: 22 }}
                  >
                    {c.emoji}
                  </div>
                  {theme.mechanic && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.08)', color: theme.text, opacity: 0.75 }}
                    >
                      {theme.mechanic}
                    </span>
                  )}
                </div>

                {/* Bottom: name + description + badge / best */}
                <div>
                  <h2 className="font-bold text-lg leading-tight mb-0.5" style={{ color: theme.text }}>
                    {c.name}
                  </h2>
                  <p className="text-sm mb-3" style={{ color: theme.text, opacity: 0.6 }}>
                    {c.description}
                  </p>

                  <div className="flex items-center gap-2">
                    {badge ? (
                      <span
                        style={{
                          background: 'rgba(0,0,0,0.65)',
                          backdropFilter: 'blur(6px)',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: 99,
                        }}
                      >
                        {BADGE_LABEL[badge]}
                      </span>
                    ) : (
                      <span className="text-xs font-bold" style={{ color: theme.accent }}>
                        {isPro ? 'Play →' : ''}
                      </span>
                    )}
                    {playsCount > 0 && bestScore !== null && (
                      <span className="text-xs" style={{ color: theme.text, opacity: 0.5 }}>
                        Best: {bestScore}/1000
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Pro lock overlay */}
              {!isPro && (
                <>
                  <div
                    className="absolute inset-0 z-20"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  />
                  <span
                    className="absolute top-3 right-3 z-30 text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ background: 'var(--accent)', color: '#111' }}
                  >
                    PRO
                  </span>
                </>
              )}
            </div>
          );

          return isPro ? (
            <Link
              key={c.slug}
              href={`/grammar/challenge/${c.slug}`}
              className="block cursor-pointer"
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
        <p className="text-center" style={{ color: 'var(--text2)', fontSize: 13, marginTop: 24 }}>
          <Link href="/pricing" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Unlock all 5 challenges with Pro →
          </Link>
        </p>
      )}
    </div>
  );
}
