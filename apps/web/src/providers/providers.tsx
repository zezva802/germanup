'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { setAccessToken } from '@/lib/session-store';

function SessionSync() {
  const { data: session } = useSession();
  useEffect(() => {
    setAccessToken((session?.accessToken as string) ?? null);
  }, [session]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Words/decks/progress only change on user actions, so don't refetch on tab focus
            // and keep data fresh for a while — avoids periodic background refetches when idle.
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    // No session refetch on focus (and no interval polling) — the access token is refreshed
    // reactively on a 401 in lib/api.ts, so there's no background /api/auth/session traffic.
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <SessionSync />
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
