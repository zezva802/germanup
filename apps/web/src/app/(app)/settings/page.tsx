'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePortal, useSubscriptionStatus } from '@/hooks/use-subscription';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: status } = useSubscriptionStatus();
  const { mutate: openPortal, isPending } = usePortal();

  const isPro = status?.plan === 'PRO';

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Account */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Account</h2>
        <p className="text-sm text-gray-700 mb-1">
          <span className="font-medium">Email:</span> {session?.user?.email ?? '—'}
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-medium">Plan:</span>{' '}
          <span className={isPro ? 'text-brand-600 font-semibold' : 'text-gray-600'}>
            {isPro ? 'Pro ✅' : 'Free'}
          </span>
        </p>
      </section>

      {/* Subscription */}
      <section className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Subscription</h2>
        {isPro ? (
          <div>
            {status?.currentPeriodEnd && (
              <p className="text-sm text-gray-600 mb-3">
                {status.status === 'cancelling' ? (
                  <>
                    Cancels on{' '}
                    <span className="font-medium text-amber-700">
                      {new Date(status.currentPeriodEnd).toLocaleDateString()}
                    </span>
                    {' '}— Pro features active until then.
                  </>
                ) : (
                  <>
                    Renews on{' '}
                    <span className="font-medium">
                      {new Date(status.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </>
                )}
              </p>
            )}
            <Button variant="secondary" onClick={() => openPortal()} loading={isPending}>
              Manage subscription →
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            You are on the Free plan.{' '}
            <a href="/pricing" className="text-brand-600 font-medium hover:underline">
              Upgrade to Pro →
            </a>
          </p>
        )}
      </section>

      {/* Sign out */}
      <section className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Session</h2>
        <Button variant="danger" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
