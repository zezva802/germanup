'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePortal, useSubscriptionStatus } from '@/hooks/use-subscription';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: status } = useSubscriptionStatus();
  const { mutate: openPortal, isPending } = usePortal();

  const isPro = status?.plan === 'PRO';

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section
      className="rounded-xl p-5 mb-3"
      style={{ background: 'var(--s2)', border: '1px solid var(--line)' }}
    >
      <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text3)' }}>
        {title}
      </p>
      {children}
    </section>
  );

  return (
    <div style={{ maxWidth: 460 }}>
      <h1 className="text-2xl font-black tracking-tight mb-6" style={{ color: 'var(--text)' }}>Settings</h1>

      <Section title="Account">
        <p className="text-sm mb-1" style={{ color: 'var(--text2)' }}>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>Email: </span>
          {session?.user?.email ?? '—'}
        </p>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          <span className="font-semibold" style={{ color: 'var(--text)' }}>Plan: </span>
          <span style={{ color: isPro ? 'var(--green)' : 'var(--text2)', fontWeight: isPro ? 700 : 400 }}>
            {isPro ? 'Pro ✅' : 'Free'}
          </span>
        </p>
      </Section>

      <Section title="Subscription">
        {isPro ? (
          <div>
            {status?.currentPeriodEnd && (
              <p className="text-sm mb-4" style={{ color: 'var(--text2)' }}>
                {status.status === 'cancelling' ? (
                  <>
                    Cancels on{' '}
                    <span className="font-semibold" style={{ color: 'var(--amber)' }}>
                      {new Date(status.currentPeriodEnd).toLocaleDateString()}
                    </span>
                    {' '}— Pro features active until then.
                  </>
                ) : (
                  <>
                    Renews on{' '}
                    <span className="font-semibold" style={{ color: 'var(--text)' }}>
                      {new Date(status.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  </>
                )}
              </p>
            )}
            <button
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--s3)', color: 'var(--text2)', border: '1px solid var(--line)' }}
              onClick={() => openPortal()}
              disabled={isPending}
            >
              {isPending ? 'Loading…' : 'Manage subscription →'}
            </button>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--text2)' }}>
            You are on the Free plan.{' '}
            <a href="/pricing" className="font-semibold transition-opacity hover:opacity-75" style={{ color: 'var(--green)' }}>
              Upgrade to Pro →
            </a>
          </p>
        )}
      </Section>

      <Section title="Session">
        <button
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)' }}
          onClick={() => void signOut({ callbackUrl: '/login' })}
        >
          Sign out
        </button>
      </Section>
    </div>
  );
}
