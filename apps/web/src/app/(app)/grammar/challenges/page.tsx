'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CHALLENGES } from '@germanup/types';
import { useProgress } from '@/hooks/use-progress';
import { getRank } from '@/lib/ranks';

const BG: Record<string, string> = {
  'the-navigator':   '/challenges/bg-navigator.png',
  'the-shapeshifter':'/challenges/bg-shapeshifter.png',
  'the-architect':   '/challenges/bg-architect.png',
  'the-arena':       '/challenges/bg-arena.png',
  'the-detective':   '/challenges/bg-detective.png',
};

const ICON: Record<string, string> = {
  'the-navigator':   '/challenges/icon-navigator.svg',
  'the-shapeshifter':'/challenges/icon-shapeshifter.svg',
  'the-architect':   '/challenges/icon-architect.svg',
  'the-arena':       '/challenges/icon-arena.svg',
  'the-detective':   '/challenges/icon-detective.svg',
};

const MECHANIC: Record<string, string> = {
  'the-navigator':   'Sort & classify',
  'the-shapeshifter':'Fill in the form',
  'the-architect':   'Build a sentence',
  'the-arena':       'Mixed · timed',
  'the-detective':   'Spot the error',
};

export default function ChallengesPage() {
  const { data: progress } = useProgress();
  const topicMap = new Map(progress?.topics.map((t) => [t.topic, t]) ?? []);

  const challenges = CHALLENGES.map((c) => {
    const totalXp      = c.topics.reduce((sum, t) => sum + (topicMap.get(t)?.xp ?? 0), 0);
    const requiredTotal = c.topics.length * c.minXp;
    const isUnlocked   = c.topics.every((t) => (topicMap.get(t)?.xp ?? 0) >= c.minXp);
    const pct          = Math.min(100, Math.round((totalXp / requiredTotal) * 100));
    const requiredRank = getRank(c.minXp);
    return { ...c, isUnlocked, totalXp, requiredTotal, pct, requiredRank };
  });

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
        {challenges.map((c) => {
          const bg   = BG[c.slug];
          const icon = ICON[c.slug];
          const mech = MECHANIC[c.slug];

          const card = (
            <div
              className="relative rounded-2xl overflow-hidden group transition-transform"
              style={{
                height: 200,
                border: '1px solid var(--line)',
                transform: c.isUnlocked ? undefined : undefined,
                opacity: !c.isUnlocked && c.pct === 0 ? 0.55 : 1,
              }}
            >
              {/* Background image */}
              {bg && (
                <Image
                  src={bg}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ filter: c.isUnlocked ? 'brightness(0.45)' : 'brightness(0.3) saturate(0.5)' }}
                />
              )}

              {/* Content overlay */}
              <div className="relative z-10 flex flex-col h-full p-5">
                {/* Top row: icon + mechanic tag */}
                <div className="flex items-start justify-between mb-auto">
                  <div
                    className="rounded-xl p-2.5"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
                  >
                    {icon && <Image src={icon} alt={c.name} width={22} height={22} />}
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}
                  >
                    {mech}
                  </span>
                </div>

                {/* Bottom: name + description + progress */}
                <div>
                  <h2 className="font-bold text-lg leading-tight mb-0.5" style={{ color: '#fff' }}>
                    {c.name}
                  </h2>
                  <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    {c.description}
                  </p>

                  {c.isUnlocked ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        <div className="h-full rounded-full" style={{ width: '100%', background: 'var(--accent)' }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>Unlocked →</span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Requires {c.requiredRank.emoji} {c.requiredRank.name} in {c.topics.length} topics
                        </span>
                        <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {c.pct}%
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${c.pct}%`, background: 'rgba(255,255,255,0.5)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );

          return c.isUnlocked ? (
            <Link
              key={c.slug}
              href={`/grammar/challenge/${c.slug}`}
              className="block cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              {card}
            </Link>
          ) : (
            <div key={c.slug}>
              {card}
            </div>
          );
        })}
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: 'var(--text3)' }}>
        Practice grammar topics to earn XP and unlock challenges.
      </p>
    </div>
  );
}
