'use client';

import Link from 'next/link';
import { LockIcon } from '@/components/words/icons';

/**
 * Calm, no-emoji Pro-lock affordance shown to Free users in place of an AI action.
 * Links to /pricing; never fires an API call.
 */
export function ProLock({ feature, hint }: { feature: string; hint?: string }) {
  return (
    <div
      className="flex flex-col items-start gap-2 rounded-xl p-5"
      style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
        >
          <LockIcon width={14} height={14} />
        </span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {feature} is a Pro feature
        </span>
      </div>
      {hint && <p className="text-xs" style={{ color: 'var(--text2)' }}>{hint}</p>}
      <Link
        href="/pricing"
        className="mt-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-opacity hover:opacity-85"
        style={{ background: 'var(--green)', color: 'var(--bg)' }}
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
