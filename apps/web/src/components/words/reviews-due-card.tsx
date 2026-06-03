'use client';

import { useRouter } from 'next/navigation';
import { useWordsStats } from '@/hooks/use-review';

export function ReviewsDueCard() {
  const router = useRouter();
  const { data: stats } = useWordsStats();

  const due = stats?.dueNow ?? 0;
  const fresh = stats?.byState.new ?? 0;
  const reviewsToday = stats?.reviewsToday ?? 0;
  const nothing = due + fresh === 0;

  return (
    <div className="mb-4 rounded-2xl p-6" style={{ background: 'var(--s2)', border: '1px solid var(--line2)' }}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
        Reviews
      </p>

      {nothing ? (
        <>
          <p className="text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>All caught up</p>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text2)' }}>
            No reviews due right now. {reviewsToday > 0 ? `You did ${reviewsToday} today.` : 'Browse decks to learn more words.'}
          </p>
          <button
            onClick={() => router.push('/words')}
            className="mt-5 rounded-lg px-5 py-2.5 text-[13px] font-bold transition-opacity hover:opacity-85"
            style={{ background: 'var(--s3)', color: 'var(--text)', border: '1px solid var(--line)' }}
          >
            Browse decks
          </button>
        </>
      ) : (
        <>
          <p className="text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
            {due} {due === 1 ? 'review' : 'reviews'} due now
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--text2)' }}>
            {fresh > 0 ? `${fresh} new ${fresh === 1 ? 'card' : 'cards'} available · ` : ''}
            Reviews count toward your streak{reviewsToday > 0 ? ` — ${reviewsToday} done today` : ''}.
          </p>
          <button
            onClick={() => router.push('/words/study')}
            className="mt-5 rounded-lg px-5 py-2.5 text-[13px] font-bold transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            Start studying
          </button>
        </>
      )}
    </div>
  );
}
