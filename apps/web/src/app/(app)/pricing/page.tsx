'use client';

import { useSession } from 'next-auth/react';
import { useCheckout } from '@/hooks/use-subscription';

const FREE_FEATURES = [
  '10 exercises per day',
  '20 flashcards per day',
  'A1 grammar theory',
  'Vocabulary list (view only)',
  'Progress tracking',
];

const PRO_FEATURES = [
  'Unlimited daily exercises',
  'Unlimited flashcards',
  'Vocabulary import with AI enrichment',
  'Verb conjugation import',
  'AI correction for translations',
  'AI correction for free writing',
  'All future Pro features',
];

export default function PricingPage() {
  const { data: session } = useSession();
  const isPro = session?.user && 'plan' in session.user && session.user.plan === 'PRO';
  const { mutate: checkout, isPending } = useCheckout();

  return (
    <div style={{ maxWidth: 680 }}>
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Pricing</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text2)' }}>
          Start for free, upgrade when you&apos;re ready.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Free */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
        >
          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Free</h2>
          <p className="mb-5" style={{ color: 'var(--text2)' }}>
            <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>€0</span>
            <span className="text-sm ml-1">/month</span>
          </p>
          <ul className="space-y-2 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text2)' }}>
                <span style={{ color: 'var(--text3)' }}>✓</span>
                {f}
              </li>
            ))}
          </ul>
          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold opacity-40 cursor-not-allowed"
            style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
            disabled
          >
            Current plan
          </button>
        </div>

        {/* Pro */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1A2D1E 0%, #1E3525 100%)',
            border: '1px solid rgba(74,222,128,0.25)',
          }}
        >
          {/* glow */}
          <div
            className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(74,222,128,0.12) 0%, transparent 70%)' }}
          />

          <div className="absolute top-4 right-4">
            <span
              className="text-xs font-bold px-2 py-1 rounded-full"
              style={{ background: 'rgba(74,222,128,0.15)', color: 'var(--green)' }}
            >
              Popular
            </span>
          </div>

          <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text)' }}>Pro</h2>
          <p className="mb-5" style={{ color: 'var(--text2)' }}>
            <span className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>€7</span>
            <span className="text-sm ml-1">/month</span>
          </p>
          <ul className="space-y-2 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(240,235,224,0.8)' }}>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          {isPro ? (
            <div
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-center"
              style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--green)', border: '1px solid rgba(74,222,128,0.2)' }}
            >
              You&apos;re on Pro ✅
            </div>
          ) : (
            <button
              onClick={() => checkout()}
              disabled={isPending}
              className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: 'var(--green)', color: 'var(--bg)' }}
            >
              {isPending ? 'Loading…' : 'Get Pro →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
