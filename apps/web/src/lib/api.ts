import axios from 'axios';
import { getSession } from 'next-auth/react';
import { getAccessToken, setAccessToken } from '@/lib/session-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  let token = getAccessToken();
  if (!token) {
    // Race condition: SessionSync hasn't run yet — fetch once and seed the store
    const session = await getSession();
    token = (session?.accessToken as string) ?? null;
    if (token) setAccessToken(token);
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Reactive token refresh: only when a request 401s do we ask NextAuth for a fresh session
// (its jwt callback refreshes the access token server-side). This lets us turn off the
// per-focus / interval session polling entirely — no background /api/auth/session traffic.
let refreshing: Promise<string | null> | null = null;
function refreshToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = getSession()
      .then((session) => {
        const token = (session?.accessToken as string) ?? null;
        setAccessToken(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as (typeof err.config & { _retried?: boolean }) | undefined;
    const status = (err as { response?: { status?: number } }).response?.status;

    if (status === 401 && original && !original._retried) {
      original._retried = true;
      const token = await refreshToken();
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      }
    }

    const message =
      (err as { response?: { data?: { message?: string } } }).response?.data?.message ??
      'Something went wrong';
    return Promise.reject(new Error(message));
  },
);
