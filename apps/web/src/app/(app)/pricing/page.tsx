'use client';

import { useSession } from 'next-auth/react';
import { useCheckout } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';

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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pricing</h1>
        <p className="text-gray-500 text-sm mt-1">
          Start for free, upgrade when you&apos;re ready.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
        {/* Free tier */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Free</h2>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              €0<span className="text-base font-normal text-gray-500">/month</span>
            </p>
          </div>
          <ul className="space-y-2 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-gray-400">✓</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            {!session ? (
              <Button variant="secondary" className="w-full" disabled>
                Current plan
              </Button>
            ) : !isPro ? (
              <Button variant="secondary" className="w-full" disabled>
                Current plan
              </Button>
            ) : null}
          </div>
        </div>

        {/* Pro tier */}
        <div className="bg-brand-600 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
            Popular
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Pro</h2>
            <p className="text-3xl font-bold mt-1">
              €7<span className="text-base font-normal opacity-80">/month</span>
            </p>
          </div>
          <ul className="space-y-2 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/90">
                <span className="text-white font-bold">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="w-full py-2 text-center text-sm font-semibold text-white/90 bg-white/10 rounded-lg">
              You&apos;re on Pro ✅
            </div>
          ) : (
            <Button
              onClick={() => checkout()}
              loading={isPending}
              className="w-full bg-white text-brand-700 hover:bg-gray-50"
            >
              Get Pro →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
