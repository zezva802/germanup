import type { CapUsage } from '@/types/words';

export function AiQuotaNote({ capUsage }: { capUsage: CapUsage }) {
  const text =
    capUsage.plan === 'PRO'
      ? `${capUsage.enrichedThisRequest} enriched by AI · unlimited (Pro)`
      : `${capUsage.enrichedThisRequest} enriched by AI · ${capUsage.used}/${capUsage.limit ?? 0} of today's AI quota used`;

  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: 'var(--s1)', border: '1px solid var(--line)', color: 'var(--text2)' }}
    >
      {text}. Rows marked <span style={{ color: 'var(--accent)' }}>AI</span> had fields filled by Claude; everything else is free.
    </div>
  );
}
